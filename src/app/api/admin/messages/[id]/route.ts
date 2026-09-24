import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function PUT(
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
      return NextResponse.json({ error: "Could not update the message." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error: any) {
    console.error("PUT contact message status API error:", error);
    return NextResponse.json({ error: "Could not update the message." }, { status: 500 });
  }
}

/**
 * Permanently remove a contact enquiry.
 *
 * A hard delete is right here: unlike an address or a used promo code, nothing
 * references `contact_messages`, so there is no order history to preserve — an
 * answered or spam enquiry is simply clutter once the admin is done with it.
 *
 * Returns 404 rather than a silent success when no row matched, so the console
 * cannot report "deleted" for an id that was never there.
 */
export async function DELETE(
  _request: Request,
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
      return apiError("Invalid message id.", 400);
    }

    const supabase = createAdminSupabaseClient();

    const { data: deleted, error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return apiError("Could not delete the message.", 500, {
        scope: "admin.messages.DELETE",
        cause: error,
      });
    }

    if (!deleted) {
      return apiError("That message no longer exists.", 404);
    }

    return NextResponse.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    return apiError("Could not delete the message.", 500, {
      scope: "admin.messages.DELETE",
      cause: error,
    });
  }
}
