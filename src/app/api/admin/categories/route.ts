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
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Fetch admin categories error:", error);
      return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
    });
  } catch (error: any) {
    console.error("GET admin categories API error:", error);
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const supabase = createAdminSupabaseClient();
    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Create category error:", error);
      return NextResponse.json({ error: error.message || "Could not create category." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error: any) {
    console.error("POST admin category API error:", error);
    return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  }
}
