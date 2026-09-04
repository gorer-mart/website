import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/server/http";
import { sweepPendingOrders } from "@/lib/server/order-settlement";

export const dynamic = "force-dynamic";

/** Upper bound per run, so one invocation cannot exceed the function timeout. */
const BATCH_SIZE = 50;

/**
 * Reconcile abandoned checkouts against Razorpay, on demand.
 *
 * Nothing schedules this. The order-list read paths sweep the pending tail on
 * their own (see `sweepPendingOrders`), and the Razorpay webhook settles every
 * checkout that produced a payment, so the shop is correct without a cron job.
 * This endpoint exists for the two cases where a sweep is wanted immediately:
 *
 *   - a manual run:
 *       curl -H "Authorization: Bearer $CRON_SECRET" \
 *            https://gorermart.in/api/reconcile-orders
 *   - an external scheduler, if one is ever wanted. Any free service that can
 *     send a bearer token works (a GitHub Actions `schedule:` workflow, or
 *     cron-job.org); no Vercel plan change is needed.
 *
 * `CRON_SECRET` is required so the endpoint is not publicly runnable. The
 * `force` flag bypasses the sweep's throttle, because an explicit request
 * should always do the work it asks for.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return apiError("Reconciliation is not configured.", 500, {
      scope: "reconcile-orders",
      cause: "CRON_SECRET is not set",
    });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    console.warn("[reconcile-orders] rejected an unauthorized request");
    return apiError("Unauthorized.", 401);
  }

  try {
    const supabase = createAdminSupabaseClient();
    const summary = await sweepPendingOrders(supabase, { limit: BATCH_SIZE, force: true });

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    return apiError("Reconciliation failed.", 500, {
      scope: "reconcile-orders",
      cause: error,
    });
  }
}
