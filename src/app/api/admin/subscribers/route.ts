import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscribers: subscribers || [],
    });
  } catch (error: any) {
    console.error("GET subscribers API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
