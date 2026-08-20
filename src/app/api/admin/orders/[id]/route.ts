import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { order_status, payment_status, tracking_number, estimated_delivery } = body;

    const supabase = createAdminSupabaseClient();

    // Build patch body dynamically based on what was provided
    const updateData: any = {};
    if (order_status !== undefined) updateData.order_status = order_status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
    if (estimated_delivery !== undefined) {
      updateData.estimated_delivery = estimated_delivery ? new Date(estimated_delivery).toISOString() : null;
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("PUT order detail API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
