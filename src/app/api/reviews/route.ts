import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ensureProductRow, isUUID, toProductUuid } from "@/lib/server/product-sync";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return apiError("Product ID is required", 400);
    }

    // A non-UUID id means the product has no database row yet, so it can have
    // no reviews. Return an empty list rather than an error.
    if (!isUUID(productId)) {
      return NextResponse.json([]);
    }

    const supabase = createAdminSupabaseClient();
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, is_verified_purchase, users(full_name, avatar_url)")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return apiError("Could not load reviews.", 500, { scope: "reviews.get", cause: error });
    }

    return NextResponse.json(reviews ?? []);
  } catch (error) {
    return apiError("Could not load reviews.", 500, { scope: "reviews.get", cause: error });
  }
}

const reviewSchema = z.object({
  productId: z.string().trim().min(1).max(200),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default(""),
  name: z.string().trim().max(300).optional(),
  price: z.coerce.number().nonnegative().optional(),
  slug: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to leave a review.", 401);
  }

  const limit = hit(`review:${user.id}`, 5, 60 * 60 * 1000);
  const limited = rateLimitResponse(limit, "You've submitted several reviews recently. Please try again later.");
  if (limited) return limited;

  const parsed = reviewSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Please check your review and try again.", 400);
  }

  const { productId: rawProductId, rating, comment, name, price, slug } = parsed.data;

  try {
    const supabase = createAdminSupabaseClient();
    const productId = toProductUuid(rawProductId);

    // Keep the products row in place so the foreign key holds.
    const sync = await ensureProductRow(supabase, {
      _id: rawProductId,
      name,
      slug,
      price,
    });
    if (!sync.ok) {
      return apiError("We could not attach your review to this product.", 500, {
        scope: "reviews.sync",
        cause: sync.reason,
      });
    }

    // One review per customer per product.
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return apiError("You've already reviewed this product.", 409);
    }

    // Mark the review as verified when this customer actually paid for the item.
    const { data: purchased } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, payment_status)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .eq("orders.payment_status", "paid")
      .limit(1);

    const isVerifiedPurchase = Array.isArray(purchased) && purchased.length > 0;

    const { data: newReview, error: insertError } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment,
        is_verified_purchase: isVerifiedPurchase,
        status: "approved",
      })
      .select("id, rating, comment, created_at, is_verified_purchase, users(full_name, avatar_url)")
      .single();

    if (insertError) {
      return apiError("Failed to submit your review. Please try again.", 500, {
        scope: "reviews.insert",
        cause: insertError,
      });
    }

    // Refresh the denormalised rating aggregate on the product.
    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("status", "approved");

    if (allReviews) {
      const count = allReviews.length;
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      await supabase
        .from("products")
        .update({
          average_rating: count > 0 ? Number((sum / count).toFixed(2)) : 0,
          review_count: count,
        })
        .eq("id", productId);
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    return apiError("Failed to submit your review. Please try again.", 500, {
      scope: "reviews.post",
      cause: error,
    });
  }
}
