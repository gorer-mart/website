import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { refreshProductRating } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/**
 * Permanently remove a review.
 *
 * Deleted rather than rejected on purpose: rejecting hides a review from the
 * product page but keeps it in the customer's own "Your Review" state, so a
 * genuinely abusive or mistaken review needs to actually go. The customer can
 * then leave a fresh one.
 *
 * `product_id` is read before the delete because the rating aggregate has to
 * be recomputed afterwards and the row is gone by then.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const { id } = await params;
    if (!isUUID(id)) {
      return apiError("Invalid review id.", 400);
    }

    const supabase = createAdminSupabaseClient();

    const { data: deleted, error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id)
      .select("id, product_id")
      .maybeSingle();

    if (error) {
      return apiError("Could not delete the review.", 500, {
        scope: "admin.reviews.DELETE",
        cause: error,
      });
    }

    if (!deleted) {
      return apiError("That review no longer exists.", 404);
    }

    // The product's star rating is a cache of this table, so it has to move
    // with the deletion or the product page keeps counting a review that is
    // no longer there.
    await refreshProductRating(supabase, deleted.product_id);

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    return apiError("Could not delete the review.", 500, {
      scope: "admin.reviews.DELETE",
      cause: error,
    });
  }
}
