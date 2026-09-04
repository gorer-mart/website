import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ensureProductRow } from "@/lib/server/product-sync";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";
import { cartItemSchema, MAX_LINES, priceCart, toMoney } from "@/lib/server/pricing";
import { evaluateCoupon } from "@/lib/server/coupons";

export const dynamic = "force-dynamic";

const shippingAddressSchema = z.object({
  firstName: z
    .string({ error: "Please enter your first name" })
    .trim()
    .min(1, "Please enter your first name")
    .max(80, "That first name is too long"),
  lastName: z.string().trim().max(80, "That last name is too long").optional().default(""),
  email: z.email("Please enter a valid email address").trim().max(254).optional(),
  phone: z
    .string({ error: "Please enter your mobile number" })
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  address: z
    .string({ error: "Please enter your street address" })
    .trim()
    .min(5, "Please enter a complete street address")
    .max(300, "That address is too long"),
  city: z.string({ error: "Please enter your city" }).trim().min(1, "Please enter your city").max(100),
  state: z.string({ error: "Please enter your state" }).trim().min(1, "Please enter your state").max(100),
  zipCode: z
    .string({ error: "Please enter your PIN code" })
    .trim()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code"),
  country: z.string().trim().max(60).optional().default("India"),
});

const bodySchema = z.object({
  cartItems: z.array(cartItemSchema).min(1).max(MAX_LINES),
  shippingAddress: shippingAddressSchema,
  /** Optional promo code. Re-validated here; never trusted from the client. */
  couponCode: z.string().trim().max(60).optional(),
});

export async function POST(request: Request) {
  // ---- 1. Authenticate -------------------------------------------------
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to place an order.", 401);
  }

  const limit = hit(`create-order:${user.id}`, 12, 10 * 60 * 1000);
  const limited = rateLimitResponse(limit, "Too many checkout attempts. Please wait a moment and try again.");
  if (limited) return limited;

  // ---- 2. Validate input ----------------------------------------------
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(first?.message || "Your order details are incomplete.", 400);
  }
  const { cartItems, shippingAddress, couponCode } = parsed.data;

  try {
    // ---- 3. Price the cart from the catalog (server is the price authority)
    // Shared with the coupon preview endpoint so a quoted discount and a
    // charged discount are always derived from the same subtotal.
    const pricing = await priceCart(cartItems);
    if (!pricing.ok) {
      return apiError(pricing.message, pricing.status);
    }
    const { subtotal, lines } = pricing;

    const supabase = createAdminSupabaseClient();

    // Mirror each catalog product into Supabase so order_items has a real FK.
    const resolvedLines: {
      productId: string;
      quantity: number;
      unitPrice: number;
      size: string | null;
      color: string | null;
      name: string;
    }[] = [];

    for (const line of lines) {
      const sync = await ensureProductRow(supabase, line.product);
      if (!sync.ok) {
        return apiError(
          `We could not process "${line.product.name}" right now. Please try again shortly.`,
          503,
          { scope: "create-order.productSync", cause: sync.reason }
        );
      }

      resolvedLines.push({
        productId: sync.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        size: line.size,
        color: line.color,
        name: line.name,
      });
    }

    // ---- 3b. Apply the promo code ----------------------------------------
    // Re-validated from scratch against the freshly computed subtotal. The
    // code may have expired, hit its usage limit, or stopped qualifying since
    // the customer applied it, so failing loudly is the only safe option:
    // silently charging full price after showing a discount is worse.
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode && couponCode.trim()) {
      const evaluation = await evaluateCoupon(supabase, couponCode, subtotal, user.id);
      if (!evaluation.ok) {
        return apiError(evaluation.reason, 409);
      }
      discountAmount = evaluation.discount;
      appliedCouponId = evaluation.coupon.id;
      appliedCouponCode = evaluation.coupon.code;
    }

    const shippingCost = 0;
    const total = toMoney(Math.max(0, subtotal + shippingCost - discountAmount));

    // A zero-rupee order cannot be sent to a payment gateway. Coupons are
    // capped at the subtotal rather than beyond it, so this only triggers on a
    // 100%-off code — which needs a different flow than "pay now".
    if (total <= 0) {
      return apiError(
        "This promo code covers your whole order. Please contact us to complete it.",
        409
      );
    }

    // ---- 4. Persist the shipping address --------------------------------
    // Reuse an identical saved address instead of inserting a fresh row on
    // every order. Previously each checkout appended another duplicate with
    // `is_default: false`, so a repeat customer accumulated identical
    // addresses, none of them marked default and none of them reusable.
    const customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
    const addressFields = {
      user_id: user.id,
      full_name: customerName,
      phone: shippingAddress.phone,
      address_line_1: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postal_code: shippingAddress.zipCode,
      country: shippingAddress.country || "India",
    };

    const { data: savedAddresses } = await supabase
      .from("addresses")
      .select("id, full_name, phone, address_line_1, city, state, postal_code, is_default")
      .eq("user_id", user.id);

    const duplicate = (savedAddresses || []).find(
      (a) =>
        a.full_name === addressFields.full_name &&
        a.phone === addressFields.phone &&
        a.address_line_1 === addressFields.address_line_1 &&
        a.city === addressFields.city &&
        a.state === addressFields.state &&
        a.postal_code === addressFields.postal_code
    );

    let shippingAddressId: string | undefined = duplicate?.id;

    if (!shippingAddressId) {
      // First address on the account becomes the default, so the next checkout
      // has something to pre-fill from.
      const hasDefault = (savedAddresses || []).some((a) => a.is_default);

      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({ ...addressFields, is_default: !hasDefault })
        .select("id")
        .single();

      if (addressError || !addressData) {
        return apiError("We could not save your shipping address. Please try again.", 500, {
          scope: "create-order.address",
          cause: addressError,
        });
      }
      shippingAddressId = addressData.id;
    }

    // Both branches above assign it, but this is the payment path: an order
    // written without a delivery address cannot be fulfilled, so fail loudly
    // rather than record one.
    if (!shippingAddressId) {
      return apiError("We could not save your shipping address. Please try again.", 500, {
        scope: "create-order.address",
      });
    }

    // ---- 5. Create the Razorpay order BEFORE the local record ------------
    // Creating it first means the local order row is never written without the
    // `razorpay_order_id` that payment verification is required to match.
    const orderNumber = `GM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountInPaise = Math.round(total * 100);

    const razorpay = new Razorpay({
      key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderNumber,
        notes: { orderNumber, userId: user.id },
      });
    } catch (error) {
      return apiError("The payment gateway is unavailable right now. Please try again shortly.", 502, {
        scope: "create-order.razorpay",
        cause: error,
      });
    }

    // ---- 6. Record the pending order -------------------------------------
    // The discount columns are only sent when a code was actually applied.
    // Beyond being tidier, this keeps an un-migrated database from breaking
    // ordinary checkout: without `015_coupons.sql` those columns do not exist,
    // and naming them unconditionally would fail every single order insert.
    const discountFields =
      discountAmount > 0
        ? {
            discount_amount: discountAmount,
            coupon_id: appliedCouponId,
            coupon_code: appliedCouponCode,
          }
        : {};

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal,
        shipping_cost: shippingCost,
        total,
        ...discountFields,
        payment_status: "pending",
        order_status: "pending",
        payment_provider: "razorpay",
        razorpay_order_id: razorpayOrder.id,
        customer_email: shippingAddress.email || user.email || null,
        customer_phone: shippingAddress.phone,
        shipping_address_id: shippingAddressId,
        billing_address_id: shippingAddressId,
      })
      .select("id")
      .single();

    if (orderError || !orderData) {
      return apiError("We could not create your order. Please try again.", 500, {
        scope: "create-order.order",
        cause: orderError,
      });
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      resolvedLines.map((line) => ({
        order_id: orderData.id,
        product_id: line.productId,
        product_name: line.name,
        quantity: line.quantity,
        price: line.unitPrice,
        size: line.size,
        color: line.color,
      }))
    );

    if (itemsError) {
      // Roll the order back so a half-written order can never be paid for.
      await supabase.from("orders").delete().eq("id", orderData.id);
      return apiError("We could not finalise your order. Please try again.", 500, {
        scope: "create-order.items",
        cause: itemsError,
      });
    }

    // ---- 7. Keep the customer profile in step ----------------------------
    // `users.phone` is the canonical contact number the admin console reads,
    // but nothing ever wrote it — the number only reached `addresses.phone` and
    // `orders.customer_phone`, so every customer showed as having no phone.
    //
    // Deliberately best-effort: the order is already recorded and paid for
    // next, so a profile write failing here must never surface to the customer.
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      const patch: Record<string, string> = {};
      if (String(profile?.phone || "").trim() !== shippingAddress.phone) {
        patch.phone = shippingAddress.phone;
      }
      if (!String(profile?.full_name || "").trim() && customerName) {
        patch.full_name = customerName;
      }

      if (Object.keys(patch).length > 0) {
        await supabase.from("users").update(patch).eq("id", user.id);
      }
    } catch (profileError) {
      console.warn("[create-order] could not sync customer profile", profileError);
    }

    return NextResponse.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      orderNumber,
      subtotal,
      discount: discountAmount,
      couponCode: appliedCouponCode,
      total,
    });
  } catch (error) {
    return apiError("An unexpected error occurred while processing your order.", 500, {
      scope: "create-order",
      cause: error,
    });
  }
}
