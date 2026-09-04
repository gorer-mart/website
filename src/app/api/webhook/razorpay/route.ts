import { NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

/**
 * Razorpay webhook.
 *
 * This is the authoritative settlement path: if the customer closes the tab
 * after paying, the browser never calls /verify-payment, and only this handler
 * confirms the order. It must therefore be idempotent and must never downgrade
 * an order that is already paid.
 */

function signatureMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function findOrder(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  razorpayOrderId: string | undefined,
  orderNumber: string | undefined
) {
  if (razorpayOrderId) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    if (data) return data;
  }

  if (orderNumber) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature") || "";
    const rawBody = await request.text();

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (!signature || !signatureMatches(expectedSignature, signature)) {
      console.warn("[razorpay-webhook] invalid signature rejected");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const payment = event?.payload?.payment?.entity;
    const eventName: string = event?.event ?? "";

    if (eventName === "payment.captured" || eventName === "payment.authorized") {
      if (!payment) return NextResponse.json({ success: true, ignored: "no payment entity" });

      const order = await findOrder(supabase, payment.order_id, payment.notes?.orderNumber);
      if (!order) {
        console.warn(`[razorpay-webhook] no local order for razorpay order ${payment.order_id}`);
        // 200 so Razorpay stops retrying an event we can never match.
        return NextResponse.json({ success: true, ignored: "unknown order" });
      }

      if (order.payment_status === "paid") {
        return NextResponse.json({ success: true, idempotent: true });
      }

      // Only settle when the captured amount matches what we billed.
      const expectedPaise = Math.round(Number(order.total) * 100);
      const paidPaise = Number(payment.amount);
      if (!Number.isFinite(paidPaise) || paidPaise !== expectedPaise || payment.currency !== "INR") {
        console.error(
          `[razorpay-webhook] amount mismatch on ${order.order_number}: ` +
            `paid=${paidPaise} expected=${expectedPaise} currency=${payment.currency}`
        );
        return NextResponse.json({ success: true, ignored: "amount mismatch" });
      }

      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id ?? undefined,
        })
        .eq("id", order.id)
        .neq("payment_status", "paid");

      if (error) {
        console.error("[razorpay-webhook] update failed", error);
        // 500 asks Razorpay to retry.
        return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
      }

      // Count the coupon redemption on this settlement path too — this webhook
      // is the backstop when the browser never reaches verify-payment (closed
      // tab, lost connection). `redeem_coupon` is idempotent, so whichever path
      // arrives first wins and the other is a no-op.
      try {
        const { error: redeemError } = await supabase.rpc("redeem_coupon", {
          p_order_id: order.id,
        });
        if (redeemError) {
          console.error("[razorpay-webhook] coupon redemption failed", redeemError);
        }
      } catch (redeemError) {
        console.error("[razorpay-webhook] coupon redemption threw", redeemError);
      }

      return NextResponse.json({ success: true });
    }

    if (eventName === "payment.failed") {
      if (!payment) return NextResponse.json({ success: true, ignored: "no payment entity" });

      const order = await findOrder(supabase, payment.order_id, payment.notes?.orderNumber);
      if (!order) return NextResponse.json({ success: true, ignored: "unknown order" });

      // Never downgrade a paid order — a customer may retry and succeed, and
      // failed/captured events can arrive out of order.
      if (order.payment_status === "paid") {
        return NextResponse.json({ success: true, idempotent: true });
      }

      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "failed", order_status: "cancelled" })
        .eq("id", order.id)
        .neq("payment_status", "paid");

      if (error) {
        console.error("[razorpay-webhook] failure update failed", error);
        return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (eventName === "refund.created" || eventName === "refund.processed") {
      const refund = event?.payload?.refund?.entity;
      const relatedPaymentId = refund?.payment_id;
      if (relatedPaymentId) {
        const { error } = await supabase
          .from("orders")
          .update({ payment_status: "refunded" })
          .eq("razorpay_payment_id", relatedPaymentId);
        if (error) console.error("[razorpay-webhook] refund update failed", error);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, ignored: eventName || "unknown event" });
  } catch (error) {
    console.error("[razorpay-webhook]", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
