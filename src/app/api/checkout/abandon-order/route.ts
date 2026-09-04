import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";
import { createRazorpayClient, reconcileOrder } from "@/lib/server/order-settlement";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderNumber: z.string().trim().min(1).max(120),
});

/**
 * Close out a checkout the customer walked away from.
 *
 * Called when the Razorpay modal is dismissed or a payment attempt fails inside
 * it, so the order does not sit in the admin console as "pending" forever.
 *
 * The client's claim that the customer cancelled is only a *hint*. Dismissing
 * the modal does not mean no payment will arrive — a UPI collect request
 * approved in another app lands minutes later. So this asks Razorpay what
 * actually exists for the order and acts on that; a real payment is settled as
 * paid instead of being cancelled.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to continue.", 401);
  }

  const limit = hit(`abandon-order:${user.id}`, 30, 10 * 60 * 1000);
  const limited = rateLimitResponse(limit, "Too many requests. Please wait a moment.");
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("An order number is required.", 400);
  }

  try {
    const supabase = createAdminSupabaseClient();

    // Scoped to the caller: one customer must never be able to cancel another's
    // order by guessing an order number.
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, razorpay_order_id")
      .eq("order_number", parsed.data.orderNumber)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return apiError("We could not update that order.", 500, {
        scope: "abandon-order.lookup",
        cause: error,
      });
    }

    // Nothing to do, and nothing to leak about whether the order exists.
    if (!order) {
      return NextResponse.json({ success: true, outcome: "not-found" });
    }

    const result = await reconcileOrder(supabase, createRazorpayClient(), order);

    return NextResponse.json({ success: true, outcome: result.outcome });
  } catch (error) {
    return apiError("We could not update that order.", 500, {
      scope: "abandon-order",
      cause: error,
    });
  }
}
