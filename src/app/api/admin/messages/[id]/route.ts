import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status || (status !== "replied" && status !== "not replied")) {
      return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: updatedMessage, error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update contact message status error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error: any) {
    console.error("PUT contact message status API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
