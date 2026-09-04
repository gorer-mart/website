import { NextResponse, after } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { sweepPendingOrders } from "@/lib/server/order-settlement";

export const dynamic = "force-dynamic";

/**
 * Pending orders reconciled per console load.
 *
 * Larger than the customer-facing sweep because this one is the shop-wide
 * backstop, and it costs nothing on the response: `after()` runs it once the
 * order list has already been sent.
 */
const SWEEP_LIMIT = 25;
const SWEEP_THROTTLE_MS = 2 * 60 * 1000;

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
    const orderStatus = searchParams.get("orderStatus") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createAdminSupabaseClient();

    // Reconcile the shop-wide pending tail against Razorpay after this
    // response is sent, so abandoned checkouts stop accumulating in the
    // console without a scheduler and without slowing the page. Throttled, so
    // paging through the list does not sweep on every request.
    after(async () => {
      try {
        await sweepPendingOrders(supabase, {
          limit: SWEEP_LIMIT,
          throttleMs: SWEEP_THROTTLE_MS,
        });
      } catch (sweepError) {
        console.error("[admin.orders] pending sweep failed", sweepError);
      }
    });

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
          product_name,
          quantity,
          price,
          size,
          color,
          products (
            title
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
      return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
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
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}
