import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/server/http";
import { createRazorpayClient, reconcileOrder } from "@/lib/server/order-settlement";

export const dynamic = "force-dynamic";

/**
 * Grace period before a pending order is reconciled.
 *
 * Long enough that a customer still typing an OTP, or waiting on a bank
 * redirect, is never cancelled underneath them. Razorpay's own async methods
 * (UPI collect, netbanking) generally resolve well inside this window.
 */
const GRACE_MINUTES = 30;

/** Upper bound per run, so one invocation cannot exceed the function timeout. */
const BATCH_SIZE = 50;

/**
 * Reconcile abandoned checkouts against Razorpay.
 *
 * The client tells us when the payment modal is dismissed, but that signal is
 * lost whenever the tab is closed, the browser crashes, or the network drops —
 * which is exactly when an order is most likely to be left pending. This sweep
 * is the backstop that does not depend on the browser at all.
 *
 * For every order still pending after the grace period it asks Razorpay what
 * happened and writes the answer: paid orders are settled (and their coupon
 * counted), genuinely abandoned ones are marked failed/cancelled, and anything
 * the gateway is still processing is left alone.
 *
 * Scheduled from `vercel.json`. Vercel Cron sends `Authorization: Bearer
 * $CRON_SECRET`, which is required here so the endpoint is not publicly
 * runnable.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return apiError("Reconciliation is not configured.", 500, {
      scope: "cron.reconcile-orders",
      cause: "CRON_SECRET is not set",
    });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    console.warn("[cron.reconcile-orders] rejected an unauthorized request");
    return apiError("Unauthorized.", 401);
  }

  try {
    const supabase = createAdminSupabaseClient();
    const cutoff = new Date(Date.now() - GRACE_MINUTES * 60 * 1000).toISOString();

    const { data: stale, error } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, razorpay_order_id")
      .eq("payment_status", "pending")
      .lt("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      return apiError("Could not load pending orders.", 500, {
        scope: "cron.reconcile-orders.query",
        cause: error,
      });
    }

    if (!stale || stale.length === 0) {
      return NextResponse.json({ success: true, examined: 0, paid: 0, abandoned: 0 });
    }

    const razorpay = createRazorpayClient();
    const tally = {
      paid: 0,
      abandoned: 0,
      inProgress: 0,
      alreadyPaid: 0,
      amountMismatch: 0,
      errors: 0,
    };

    // Sequential on purpose: Razorpay rate-limits, and a batch of 50 finishing
    // a little slower is better than a burst getting throttled and every order
    // in it falling back to "could not verify".
    for (const order of stale) {
      const result = await reconcileOrder(supabase, razorpay, order);
      switch (result.outcome) {
        case "paid":
          tally.paid += 1;
          console.info(`[cron.reconcile-orders] settled ${order.order_number} as paid`);
          break;
        case "abandoned":
          tally.abandoned += 1;
          break;
        case "in-progress":
          tally.inProgress += 1;
          break;
        case "already-paid":
          tally.alreadyPaid += 1;
          break;
        case "amount-mismatch":
          // Already logged as an error by the settlement module; counted here
          // so the run summary shows an anomaly needs attention.
          tally.amountMismatch += 1;
          break;
        default:
          tally.errors += 1;
      }
    }

    console.info(
      `[cron.reconcile-orders] examined ${stale.length}: ` +
        `${tally.paid} paid, ${tally.abandoned} abandoned, ${tally.inProgress} in progress, ` +
        `${tally.amountMismatch} amount mismatches, ${tally.errors} unverifiable`
    );

    return NextResponse.json({ success: true, examined: stale.length, ...tally });
  } catch (error) {
    return apiError("Reconciliation failed.", 500, {
      scope: "cron.reconcile-orders",
      cause: error,
    });
  }
}
