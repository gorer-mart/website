import type { SupabaseClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { env } from "@/lib/env";
import { hit } from "@/lib/server/rate-limit";

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
 *   - `/api/checkout/abandon-order` when the customer dismisses the modal,
 *   - `sweepPendingOrders` below, called opportunistically from the order-list
 *     read paths, for attempts where the browser never came back to tell us
 *     anything, and
 *   - `/api/reconcile-orders`, the same sweep behind a shared secret for an
 *     external scheduler or a manual run.
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

/* ------------------------------------------------------------------ */
/* Sweep — reconcile the pending tail without a scheduler              */
/* ------------------------------------------------------------------ */

/**
 * How long a pending order is left alone before it is reconciled.
 *
 * Long enough that a customer still typing an OTP, or waiting on a bank
 * redirect, is never cancelled underneath them. Razorpay's own async methods
 * (UPI collect, netbanking) generally resolve well inside this window.
 */
export const SETTLEMENT_GRACE_MINUTES = 30;

export interface SweepOptions {
  /** Restrict the sweep to one customer's orders. Omit to sweep everyone's. */
  userId?: string;
  /** Upper bound on orders examined in one pass. */
  limit?: number;
  /** Skip the throttle. For an explicitly triggered run, never a page load. */
  force?: boolean;
  /** Minimum gap between throttled sweeps of the same scope. */
  throttleMs?: number;
}

export interface SweepSummary {
  examined: number;
  paid: number;
  abandoned: number;
  inProgress: number;
  alreadyPaid: number;
  amountMismatch: number;
  errors: number;
  /** True when the throttle skipped this run entirely. */
  throttled: boolean;
}

const EMPTY_SUMMARY: SweepSummary = {
  examined: 0,
  paid: 0,
  abandoned: 0,
  inProgress: 0,
  alreadyPaid: 0,
  amountMismatch: 0,
  errors: 0,
  throttled: false,
};

/**
 * Reconcile the orders still sitting pending past the grace period.
 *
 * There is deliberately no scheduler behind this. The webhook already settles
 * every checkout that produced a payment — captured, authorized or failed — so
 * what reaches this sweep is the residue: orders where the customer created a
 * gateway order and then vanished without a single payment attempt, leaving a
 * row that no event will ever resolve. Nothing about that is time-critical, so
 * it is done when somebody actually looks at an order list (the customer's own
 * history, or the admin console) rather than on a clock.
 *
 * Two consequences worth being explicit about. Money is never at stake here:
 * settlement of real payments happens in the webhook, on its own schedule.
 * And a shop with no traffic never sweeps — which is correct, because with no
 * readers there is also nobody to be misled by a stale pending row.
 *
 * The throttle is in-process, so on serverless each instance keeps its own
 * clock and a cold start resets it. That only ever means an extra sweep, and
 * every write inside `reconcileOrder` is idempotent, so an extra sweep is
 * harmless.
 */
export async function sweepPendingOrders(
  supabase: SupabaseClient,
  options: SweepOptions = {}
): Promise<SweepSummary> {
  const { userId, limit = 25, force = false, throttleMs = 5 * 60 * 1000 } = options;

  const scope = userId ?? "global";

  if (!force) {
    const allowed = hit(`settlement-sweep:${scope}`, 1, throttleMs);
    if (!allowed.ok) return { ...EMPTY_SUMMARY, throttled: true };
  }

  const cutoff = new Date(Date.now() - SETTLEMENT_GRACE_MINUTES * 60 * 1000).toISOString();

  let query = supabase
    .from("orders")
    .select("id, order_number, total, payment_status, razorpay_order_id")
    .eq("payment_status", "pending")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (userId) query = query.eq("user_id", userId);

  const { data: stale, error } = await query;

  if (error) {
    console.error("[settlement] could not load pending orders", error);
    return { ...EMPTY_SUMMARY, errors: 1 };
  }

  if (!stale || stale.length === 0) return { ...EMPTY_SUMMARY };

  const razorpay = createRazorpayClient();
  const summary: SweepSummary = { ...EMPTY_SUMMARY, examined: stale.length };

  // Sequential on purpose: Razorpay rate-limits, and a batch finishing a
  // little slower is better than a burst getting throttled and every order in
  // it falling back to "could not verify".
  for (const order of stale) {
    const result = await reconcileOrder(supabase, razorpay, order);
    switch (result.outcome) {
      case "paid":
        summary.paid += 1;
        console.info(`[settlement] settled ${order.order_number} as paid`);
        break;
      case "abandoned":
        summary.abandoned += 1;
        break;
      case "in-progress":
        summary.inProgress += 1;
        break;
      case "already-paid":
        summary.alreadyPaid += 1;
        break;
      case "amount-mismatch":
        // Already logged as an error by `reconcileOrder`; counted here so a
        // run summary shows that an anomaly needs attention.
        summary.amountMismatch += 1;
        break;
      default:
        summary.errors += 1;
    }
  }

  console.info(
    `[settlement] swept ${summary.examined} pending order(s) for ${scope}: ` +
      `${summary.paid} paid, ${summary.abandoned} abandoned, ${summary.inProgress} in progress, ` +
      `${summary.amountMismatch} amount mismatches, ${summary.errors} unverifiable`
  );

  return summary;
}
