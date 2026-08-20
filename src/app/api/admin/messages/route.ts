import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";

    const supabase = createAdminSupabaseClient();

    // Fetch contact messages sorted by sending time descending
    let query = supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      // Use or filter to match name, email, subject, or message body
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Fetch contact messages error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error: any) {
    console.error("GET contact messages API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
