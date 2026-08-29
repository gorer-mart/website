import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { z } from "zod";

// Statuses must match the payment_status / order_status enums in the database.
const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

const updateSchema = z.object({
  order_status: z.enum(ORDER_STATUSES).optional(),
  payment_status: z.enum(PAYMENT_STATUSES).optional(),
  tracking_number: z.string().trim().max(120).nullable().optional(),
  estimated_delivery: z.string().trim().max(60).nullable().optional(),
});

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

    if (!isUUID(id)) {
      return apiError("Invalid order id.", 400);
    }

    const parsed = updateSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid update payload.", 400);
    }
    const { order_status, payment_status, tracking_number, estimated_delivery } = parsed.data;

    const supabase = createAdminSupabaseClient();

    // Build patch body dynamically based on what was provided
    const updateData: any = {};
    if (order_status !== undefined) updateData.order_status = order_status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number || null;
    if (estimated_delivery !== undefined) {
      updateData.estimated_delivery = estimated_delivery
        ? new Date(estimated_delivery).toISOString()
        : null;
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("Nothing to update.", 400);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating order ${id}:`, error);
      return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("PUT order detail API error:", error);
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}

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
      return apiError("Invalid order id.", 400);
    }

    const supabase = createAdminSupabaseClient();

    // Clean up order items first
    await supabase.from("order_items").delete().eq("order_id", id);

    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      console.error(`Error deleting order ${id}:`, error);
      return NextResponse.json({ error: "Could not delete the order." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE order API error:", error);
    return NextResponse.json({ error: "Could not delete the order." }, { status: 500 });
  }
}

