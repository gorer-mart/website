import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(120),
  razorpay_payment_id: z.string().trim().min(1).max(120),
  razorpay_signature: z.string().trim().min(1).max(256),
  orderNumber: z.string().trim().min(1).max(120),
});

/** Constant-time comparison so a signature cannot be recovered by timing. */
function signatureMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to complete your payment.", 401);
  }

  const limit = hit(`verify-payment:${user.id}`, 20, 10 * 60 * 1000);
  const limited = rateLimitResponse(limit, "Too many verification attempts. Please contact support.");
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("Missing required verification fields.", 400);
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderNumber } = parsed.data;

  try {
    const supabase = createAdminSupabaseClient();

    // ---- 1. Load the order, scoped to the caller -------------------------
    const { data: order, error: lookupError } = await supabase
      .from("orders")
      .select("id, user_id, total, payment_status, order_status, razorpay_order_id")
      .eq("order_number", orderNumber)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      return apiError("We could not verify your payment. Please contact support.", 500, {
        scope: "verify-payment.lookup",
        cause: lookupError,
      });
    }

    if (!order) {
      return apiError("Order not found.", 404);
    }

    // ---- 2. The signed Razorpay order must be THIS order -----------------
    // Without this check a signature legitimately obtained for a cheap order
    // could be replayed to mark an expensive pending order as paid.
    if (!order.razorpay_order_id || order.razorpay_order_id !== razorpay_order_id) {
      console.warn(
        `[verify-payment] razorpay order mismatch for ${orderNumber} (user ${user.id})`
      );
      return apiError("Payment verification failed.", 400);
    }

    // ---- 3. Idempotency: a settled order stays settled --------------------
    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified.",
        orderNumber,
      });
    }

    // ---- 4. Verify the HMAC signature ------------------------------------
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signatureMatches(expectedSignature, razorpay_signature)) {
      await supabase
        .from("orders")
        .update({ payment_status: "failed", order_status: "cancelled" })
        .eq("id", order.id)
        .neq("payment_status", "paid");

      return apiError("Payment verification failed.", 400);
    }

    // ---- 5. Confirm the captured amount with Razorpay ---------------------
    // The signature proves the payload came from Razorpay; it does not prove
    // how much was actually paid. Fetch the authoritative payment record.
    const razorpay = new Razorpay({
      key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    let payment: any;
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (error) {
      // Do not mark the order paid on an unverifiable amount. The webhook is
      // the backstop and will settle it once Razorpay reports the capture.
      return apiError(
        "We could not confirm your payment with the gateway. If your money was debited, it will be confirmed shortly.",
        502,
        { scope: "verify-payment.fetch", cause: error }
      );
    }

    const expectedPaise = Math.round(Number(order.total) * 100);
    const paidPaise = Number(payment?.amount);

    const amountOk = Number.isFinite(paidPaise) && paidPaise === expectedPaise;
    const orderOk = payment?.order_id === razorpay_order_id;
    const currencyOk = payment?.currency === "INR";
    const statusOk = payment?.status === "captured" || payment?.status === "authorized";

    if (!amountOk || !orderOk || !currencyOk || !statusOk) {
      console.warn(
        `[verify-payment] payment rejected for ${orderNumber}: ` +
          `amount=${paidPaise}/${expectedPaise} order=${payment?.order_id} ` +
          `currency=${payment?.currency} status=${payment?.status}`
      );
      return apiError("Payment verification failed.", 400);
    }

    // ---- 6. Settle the order ---------------------------------------------
    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id,
      })
      .eq("id", order.id)
      .select("order_number, total, order_status, payment_status")
      .single();

    if (updateError) {
      return apiError(
        "Your payment succeeded but we could not update the order. Our team has been notified.",
        500,
        { scope: "verify-payment.update", cause: updateError }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      order: updated,
    });
  } catch (error) {
    return apiError("An unexpected error occurred during payment verification.", 500, {
      scope: "verify-payment",
      cause: error,
    });
  }
}
