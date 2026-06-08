import { NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature") || "";
    const rawBody = await request.text();

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("Invalid Razorpay webhook signature detected");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const supabase = createAdminSupabaseClient();

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderNumber = payment.notes?.orderNumber || payment.description;

      if (orderNumber) {
        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            order_status: "confirmed",
          })
          .eq("order_number", orderNumber);

        if (error) {
          console.error("Webhook database update error:", error);
          return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
        }
      }
    } else if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderNumber = payment.notes?.orderNumber || payment.description;

      if (orderNumber) {
        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            order_status: "cancelled",
          })
          .eq("order_number", orderNumber);

        if (error) {
          console.error("Webhook database update error:", error);
          return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";
