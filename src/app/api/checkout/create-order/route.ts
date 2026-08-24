import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { client as sanityClient } from "@/lib/sanity";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ensureProductRow } from "@/lib/server/product-sync";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const MAX_QTY_PER_LINE = 10;
const MAX_LINES = 20;
const MAX_ORDER_VALUE = 500_000; // ₹5,00,000 sanity ceiling

const cartItemSchema = z.object({
  _id: z.string().trim().min(1).max(200).optional(),
  id: z.union([z.string().trim().min(1).max(200), z.number()]).optional(),
  name: z.string().trim().max(300).optional(),
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().positive().max(MAX_QTY_PER_LINE),
  size: z.string().trim().max(40).optional(),
  color: z.string().trim().max(60).optional(),
});

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
});

interface CatalogProduct {
  _id: string;
  id?: number | string | null;
  name?: string | null;
  slug?: string | null;
  price?: number | null;
  sizes?: string[] | null;
}

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
  const { cartItems, shippingAddress } = parsed.data;

  try {
    // ---- 3. Resolve the catalog from Sanity (server is the price authority)
    const sanityIds = cartItems
      .map((item) => item._id ?? (typeof item.id === "string" ? item.id : undefined))
      .filter((v): v is string => typeof v === "string");

    const numericIds = cartItems
      .map((item) => {
        const raw = item.id ?? item._id;
        const n = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(n) ? n : undefined;
      })
      .filter((v): v is number => typeof v === "number");

    const catalog: CatalogProduct[] = await sanityClient.fetch(
      `*[_type == "product" && (_id in $sanityIds || id in $numericIds)] {
        _id, id, name, "slug": slug.current, price, sizes
      }`,
      { sanityIds, numericIds }
    );

    // Index by every identifier a client could legitimately send.
    const byKey = new Map<string, CatalogProduct>();
    for (const product of catalog) {
      byKey.set(product._id, product);
      if (product.id !== undefined && product.id !== null) {
        byKey.set(String(product.id), product);
      }
    }

    const supabase = createAdminSupabaseClient();

    const resolvedLines: {
      productId: string;
      quantity: number;
      unitPrice: number;
      size: string | null;
      color: string | null;
      name: string;
    }[] = [];

    let subtotal = 0;

    for (const item of cartItems) {
      const lookupKeys = [item._id, item.id !== undefined ? String(item.id) : undefined].filter(
        (v): v is string => typeof v === "string"
      );

      const product = lookupKeys.map((k) => byKey.get(k)).find(Boolean);

      if (!product) {
        return apiError(
          `"${item.name || "An item in your bag"}" is no longer available. Please remove it and try again.`,
          400
        );
      }

      const serverPrice = Number(product.price);
      if (!Number.isFinite(serverPrice) || serverPrice < 0) {
        return apiError(`Pricing is unavailable for "${product.name}". Please try again later.`, 400);
      }

      // The server price is authoritative. A mismatch means the price moved
      // while the item sat in the bag — tell the customer instead of silently
      // charging a different amount than the one they were shown.
      if (item.price !== undefined && Math.round(item.price) !== Math.round(serverPrice)) {
        return apiError(
          `The price of "${product.name}" has changed. Please review your bag and try again.`,
          409
        );
      }

      // Size must be one the catalog actually offers.
      const availableSizes = Array.isArray(product.sizes) ? product.sizes : [];
      const size: string | null = item.size ?? null;
      if (availableSizes.length > 0) {
        if (!size || !availableSizes.includes(size)) {
          return apiError(`Please choose an available size for "${product.name}".`, 400);
        }
      }

      const sync = await ensureProductRow(supabase, product);
      if (!sync.ok) {
        return apiError(
          `We could not process "${product.name}" right now. Please try again shortly.`,
          503,
          { scope: "create-order.productSync", cause: sync.reason }
        );
      }

      subtotal += serverPrice * item.quantity;
      resolvedLines.push({
        productId: sync.productId,
        quantity: item.quantity,
        unitPrice: serverPrice,
        size,
        color: item.color ?? null,
        name: product.name || item.name || "Gorer Mart Product",
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    if (subtotal <= 0) {
      return apiError("Your order total is invalid. Please review your bag.", 400);
    }
    if (subtotal > MAX_ORDER_VALUE) {
      return apiError("This order exceeds the maximum value we can process online.", 400);
    }

    const shippingCost = 0;
    const total = Math.round((subtotal + shippingCost) * 100) / 100;

    // ---- 4. Persist the shipping address --------------------------------
    const { data: addressData, error: addressError } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
        phone: shippingAddress.phone,
        address_line_1: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.zipCode,
        country: shippingAddress.country || "India",
        is_default: false,
      })
      .select("id")
      .single();

    if (addressError || !addressData) {
      return apiError("We could not save your shipping address. Please try again.", 500, {
        scope: "create-order.address",
        cause: addressError,
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
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal,
        shipping_cost: shippingCost,
        total,
        payment_status: "pending",
        order_status: "pending",
        payment_provider: "razorpay",
        razorpay_order_id: razorpayOrder.id,
        customer_email: shippingAddress.email || user.email || null,
        customer_phone: shippingAddress.phone,
        shipping_address_id: addressData.id,
        billing_address_id: addressData.id,
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

    return NextResponse.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      orderNumber,
      total,
    });
  } catch (error) {
    return apiError("An unexpected error occurred while processing your order.", 500, {
      scope: "create-order",
      cause: error,
    });
  }
}
