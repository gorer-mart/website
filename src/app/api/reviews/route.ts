import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    if (!isUUID(productId)) {
      // If product ID is not a valid UUID (e.g. static fallback id "1"), return empty array
      return NextResponse.json([]);
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("id, rating, comment, created_at, user_id, users(full_name, avatar_url)")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch reviews error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(reviews || []);
  } catch (error: any) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Authenticate the user using Next.js Supabase Server Client
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, comment, name, price, slug } = body;

    if (!productId || !rating) {
      return NextResponse.json({ error: "Product ID and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!isUUID(productId)) {
      return NextResponse.json({ error: "Product ID must be a valid UUID" }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // 1. Sync product to Supabase products table if it's missing (to satisfy foreign key)
    const { data: existingProduct } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (!existingProduct) {
      const { error: syncError } = await supabaseAdmin.from("products").insert({
        id: productId,
        title: name || "Gorer Mart Product",
        slug: slug || `product-${productId}`,
        price: Number(price) || 0,
        status: "active",
      });

      if (syncError) {
        console.error("Sync product error:", syncError);
        return NextResponse.json({ error: "Product synchronization failed" }, { status: 500 });
      }
    }

    // 2. Insert the new review with status = 'approved'
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        rating: Number(rating),
        comment: comment || "",
        status: "approved",
      })
      .select("id, rating, comment, created_at, user_id, users(full_name, avatar_url)")
      .single();

    if (insertError) {
      console.error("Insert review error:", insertError);
      return NextResponse.json({ error: insertError.message || "Failed to submit review" }, { status: 500 });
    }

    // 3. Recalculate average_rating and review_count for the product
    const { data: allReviews, error: fetchErr } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("status", "approved");

    if (!fetchErr && allReviews) {
      const count = allReviews.length;
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;

      await supabaseAdmin
        .from("products")
        .update({
          average_rating: avg,
          review_count: count,
        })
        .eq("id", productId);
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    console.error("POST reviews error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
