import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const orderStatus = searchParams.get("orderStatus") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createAdminSupabaseClient();

    // Fetch all orders with customer profile, address, and items
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        users (
          full_name,
          email,
          phone
        ),
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
          product_id,
          quantity,
          price,
          products (
            title
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter in JS for robust and flexible search across nested models
    let filteredOrders = orders || [];

    if (orderStatus) {
      filteredOrders = filteredOrders.filter(o => o.order_status === orderStatus);
    }

    if (paymentStatus) {
      filteredOrders = filteredOrders.filter(o => o.payment_status === paymentStatus);
    }

    if (search) {
      filteredOrders = filteredOrders.filter((o) => {
        const orderNumMatches = o.order_number?.toLowerCase().includes(search);
        const nameMatches = o.users?.full_name?.toLowerCase().includes(search);
        const emailMatches = o.users?.email?.toLowerCase().includes(search);
        return orderNumMatches || nameMatches || emailMatches;
      });
    }

    const totalCount = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("GET orders API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
