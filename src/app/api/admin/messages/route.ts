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
      return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error: any) {
    console.error("GET contact messages API error:", error);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }
}
