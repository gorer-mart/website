import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function DELETE(
  request: Request,
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
      return apiError("Invalid product id.", 400);
    }

    const supabase = createAdminSupabaseClient();

    // Delete variants first
    await supabase.from("product_variants").delete().eq("product_id", id);

    // Delete product images
    await supabase.from("product_images").delete().eq("product_id", id);

    // Delete product
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error(`Error deleting product ${id}:`, error);
      return NextResponse.json({ error: "Could not delete product." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE product API error:", error);
    return NextResponse.json({ error: "Could not delete product." }, { status: 500 });
  }
}
