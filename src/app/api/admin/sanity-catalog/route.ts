import { NextResponse } from "next/server";
import { getProducts, getCategories } from "@/lib/sanity";
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
    const [sanityProducts, sanityCategories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    return NextResponse.json({
      success: true,
      products: sanityProducts || [],
      categories: sanityCategories || [],
    });
  } catch (error: any) {
    console.error("GET admin sanity catalog error:", error);
    return NextResponse.json({ error: "Could not fetch Sanity catalog." }, { status: 500 });
  }
}
