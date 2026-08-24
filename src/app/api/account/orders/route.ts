import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Order history for the signed-in customer.
 *
 * Every query is scoped by the user id resolved from the session cookie, never
 * from anything the client sends.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to view your orders.", 401);
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        subtotal,
        shipping_cost,
        total,
        payment_status,
        order_status,
        tracking_number,
        estimated_delivery,
        created_at,
        shipping_address:addresses!shipping_address_id (
          full_name,
          phone,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country
        ),
        order_items (
          id,
          product_name,
          quantity,
          price,
          size,
          color,
          products ( title, slug )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return apiError("Could not load your orders.", 500, {
        scope: "account.orders",
        cause: error,
      });
    }

    return NextResponse.json({ success: true, orders: orders ?? [] });
  } catch (error) {
    return apiError("Could not load your orders.", 500, {
      scope: "account.orders",
      cause: error,
    });
  }
}
