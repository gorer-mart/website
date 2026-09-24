import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recompute the denormalised rating aggregate on a product.
 *
 * `products.average_rating` and `products.review_count` are caches of the
 * `reviews` table, so anything that changes which reviews are approved — a
 * moderation decision, a new review, a deletion — has to call this or the
 * product page keeps showing a stale star rating.
 *
 * Only `approved` reviews count, which is also why a review being deleted and
 * a review being rejected both land here.
 *
 * Best-effort by design: the caller's own write has already succeeded by the
 * time this runs, so a failure is logged and swallowed rather than turned into
 * an error the admin sees for an action that did in fact happen. The next
 * change to that product's reviews repairs the figure.
 */
export async function refreshProductRating(
  supabase: SupabaseClient,
  productId: string | null | undefined
): Promise<void> {
  if (!productId) return;

  const { data: approved, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("status", "approved");

  if (error) {
    console.error("[reviews] could not recount ratings", error);
    return;
  }

  const count = approved?.length ?? 0;
  const sum = (approved ?? []).reduce((total, row) => total + Number(row.rating || 0), 0);

  const { error: updateError } = await supabase
    .from("products")
    .update({
      average_rating: count > 0 ? Number((sum / count).toFixed(2)) : 0,
      review_count: count,
    })
    .eq("id", productId);

  if (updateError) {
    console.error("[reviews] could not write rating aggregate", updateError);
  }
}
