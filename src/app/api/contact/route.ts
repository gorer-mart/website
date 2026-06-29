import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Server-side validation
    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        name,
        email,
        phone,
        subject,
        message,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase contact insertion error:", error);
      return NextResponse.json({ error: error.message || "Failed to submit message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("POST contact error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
