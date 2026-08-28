import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";

    const supabase = createAdminSupabaseClient();

    // Query newsletter subscribers
    let query = supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data: subscribers, error } = await query;

    if (error) {
      console.error("Fetch subscribers error:", error);
      return NextResponse.json({ error: "Could not load subscribers." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscribers: subscribers || [],
    });
  } catch (error: any) {
    console.error("GET subscribers API error:", error);
    return NextResponse.json({ error: "Could not load subscribers." }, { status: 500 });
  }
}
