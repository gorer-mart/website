import type { SupabaseClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { env } from "@/lib/env";

/**
 * Settle a pending order against Razorpay's authoritative payment record.
 *
 * A local order row is written before the customer pays, so that a payment
 * which lands later — after the tab is closed, or when a UPI collect request is
 * approved minutes afterwards — still has an order to attach to. The cost of
 * that safety is pending rows that nothing cleans up.
 *
 * This module is the single place that decides what a pending order really is.
 * It never guesses from client signals: it asks Razorpay which payments exist
 * for the order and acts on the answer. Used by
 *   - `/api/checkout/abandon-order` when the customer dismisses the modal, and
 *   - `/api/cron/reconcile-orders` for attempts where the browser never came
 *     back to tell us anything.
 *
 * Deliberately does *not* delete rows. Deleting a pending order whose Razorpay
 * order is still payable would orphan any later payment, leaving money taken
 * with nothing to fulfil.
 */

export interface ReconcilableOrder {
  id: string;
  order_number: string;
  total: number | string;
  payment_status: string;
  razorpay_order_id?: string | null;
}

export type SettlementOutcome =
  /** A real payment exists; the order is now marked paid. */
  | { outcome: "paid"; paymentId: string }
  /** No successful payment; the order is now marked failed/cancelled. */
  | { outcome: "abandoned" }
  /** A payment is mid-flight — left alone for the webhook to settle. */
  | { outcome: "in-progress" }
  /** Already paid before we looked. */
  | { outcome: "already-paid" }
  /**
   * Money was taken but does not match what we billed. Left untouched for a
   * human to look at — see the note in `reconcileOrder`.
   */
  | { outcome: "amount-mismatch"; paymentId: string }
  | { outcome: "error"; reason: unknown };

/** Statuses that mean the customer's money is committed. */
const SUCCESSFUL = new Set(["captured", "authorized"]);
/**
 * Statuses that mean a payment is still being processed. Marking these as
 * abandoned would cancel an order that is about to succeed.
 */
const PENDING_AT_GATEWAY = new Set(["created", "pending"]);

export function createRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Ask Razorpay what happened to this order and write the answer.
 *
 * Safe to call repeatedly and from more than one path at once: the paid write
 * is guarded by `.neq("payment_status", "paid")`, and coupon redemption is
 * idempotent inside `redeem_coupon`.
 */
export async function reconcileOrder(
  supabase: SupabaseClient,
  razorpay: Razorpay,
  order: ReconcilableOrder
): Promise<SettlementOutcome> {
  if (order.payment_status === "paid") {
    return { outcome: "already-paid" };
  }

  // Without a gateway order id there is nothing to reconcile against. Every
  // order created since `013_checkout_integrity.sql` has one, so treat the
  // absence as an abandoned attempt rather than leaving it pending forever.
  if (!order.razorpay_order_id) {
    await markAbandoned(supabase, order.id);
    return { outcome: "abandoned" };
  }

  let payments: any[] = [];
  try {
    const response: any = await razorpay.orders.fetchPayments(order.razorpay_order_id);
    payments = Array.isArray(response?.items) ? response.items : [];
  } catch (reason) {
    // Never abandon an order we could not verify — a gateway outage would
    // cancel perfectly good orders.
    console.error(`[settlement] could not fetch payments for ${order.order_number}`, reason);
    return { outcome: "error", reason };
  }

  const expectedPaise = Math.round(Number(order.total) * 100);

  // A payment that actually settles this order: succeeded, right amount, right
  // currency. Anything merely successful is tracked separately so a wrong
  // amount is reported rather than silently cancelled.
  const successful = payments.find(
    (p) =>
      SUCCESSFUL.has(String(p?.status)) &&
      Number(p?.amount) === expectedPaise &&
      p?.currency === "INR"
  );
  const anySuccessful = payments.find((p) => SUCCESSFUL.has(String(p?.status)));

  // Money was taken, but not the amount we billed. Do not mark this paid — the
  // customer has not settled the order — and equally do not mark it abandoned,
  // which would bury a real payment behind a cancelled order. Leave it pending
  // and shout, so it surfaces as an anomaly a human resolves.
  if (!successful && anySuccessful) {
    console.error(
      `[settlement] AMOUNT MISMATCH on ${order.order_number}: ` +
        `payment ${anySuccessful.id} is ${anySuccessful.amount} ${anySuccessful.currency}, ` +
        `expected ${expectedPaise} INR. Order left pending for manual review.`
    );
    return { outcome: "amount-mismatch", paymentId: String(anySuccessful.id) };
  }

  if (successful) {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id: successful.id,
      })
      .eq("id", order.id)
      // Whoever gets there first wins; this must not overwrite a settled order.
      .neq("payment_status", "paid");

    if (error) {
      console.error(`[settlement] paid update failed for ${order.order_number}`, error);
      return { outcome: "error", reason: error };
    }

    // Mirrors the verify-payment path so a coupon used on a payment we only
    // discovered here still counts. Best-effort: the money is already settled.
    try {
      const { error: redeemError } = await supabase.rpc("redeem_coupon", {
        p_order_id: order.id,
      });
      if (redeemError) {
        console.error(`[settlement] coupon redemption failed for ${order.order_number}`, redeemError);
      }
    } catch (redeemError) {
      console.error(`[settlement] coupon redemption threw for ${order.order_number}`, redeemError);
    }

    return { outcome: "paid", paymentId: successful.id };
  }

  // A payment the gateway is still working on — leave it for the webhook.
  if (payments.some((p) => PENDING_AT_GATEWAY.has(String(p?.status)))) {
    return { outcome: "in-progress" };
  }

  const { error } = await markAbandoned(supabase, order.id);
  if (error) {
    console.error(`[settlement] abandon update failed for ${order.order_number}`, error);
    return { outcome: "error", reason: error };
  }

  return { outcome: "abandoned" };
}

/**
 * Record a checkout the customer never completed.
 *
 * `failed` + `cancelled` are existing enum values, so no schema change is
 * needed. The pair is what the admin console treats as an abandoned attempt:
 * a cancelled order that never had a payment.
 */
export function markAbandoned(supabase: SupabaseClient, orderId: string) {
  return supabase
    .from("orders")
    .update({ payment_status: "failed", order_status: "cancelled" })
    .eq("id", orderId)
    .neq("payment_status", "paid");
}
