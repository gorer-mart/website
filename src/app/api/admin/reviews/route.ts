import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const supabase = createAdminSupabaseClient();

    // Fetch all reviews, including pending ones, joined with user and product details
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        *,
        users (
          full_name,
          email
        ),
        products (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch admin reviews error:", error);
      return NextResponse.json({ error: "Could not complete the review operation." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
    });
  } catch (error: any) {
    console.error("GET admin reviews API error:", error);
    return NextResponse.json({ error: "Could not complete the review operation." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const body = await request.json();
    const { reviewId, status } = body;

    if (!reviewId || !status) {
      return NextResponse.json({ error: "Missing reviewId or status details" }, { status: 400 });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid review status" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // 1. Fetch review to get product_id before updating
    const { data: review, error: fetchErr } = await supabase
      .from("reviews")
      .select("product_id")
      .eq("id", reviewId)
      .single();

    if (fetchErr || !review) {
      console.error("Review not found for status update:", fetchErr);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const productId = review.product_id;

    // 2. Update review status
    const { data: updatedReview, error: updateErr } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateErr) {
      console.error("Error updating review status:", updateErr);
      return NextResponse.json({ error: "Could not complete the review operation." }, { status: 500 });
    }

    // 3. Recalculate average_rating and review_count for the product
    const { data: allReviews, error: calcErr } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("status", "approved");

    if (!calcErr && allReviews) {
      const count = allReviews.length;
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;

      await supabase
        .from("products")
        .update({
          average_rating: avg,
          review_count: count,
        })
        .eq("id", productId);
    }

    return NextResponse.json({
      success: true,
      message: `Review marked as ${status} successfully`,
      review: updatedReview,
    });
  } catch (error: any) {
    console.error("PUT admin review status update API error:", error);
    return NextResponse.json({ error: "Could not complete the review operation." }, { status: 500 });
  }
}
