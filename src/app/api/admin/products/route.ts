import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Retrieve database products and their respective variants
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (
          id,
          size,
          color,
          sku,
          stock,
          price_override
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch admin products list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      products: products || [],
    });
  } catch (error: any) {
    console.error("GET admin products API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { variantId, stock } = body;

    if (!variantId || stock === undefined) {
      return NextResponse.json({ error: "Missing variantId or stock level details" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: updatedVariant, error } = await supabase
      .from("product_variants")
      .update({ stock: parseInt(stock, 10) })
      .eq("id", variantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating variant stock:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Variant stock updated successfully",
      variant: updatedVariant,
    });
  } catch (error: any) {
    console.error("PUT admin products stock update API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
