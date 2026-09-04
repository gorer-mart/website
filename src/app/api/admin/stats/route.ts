import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Ranges the revenue chart can be viewed over.
 *
 * `bucket` controls how points are grouped: daily up to 30 days stays readable,
 * but 90 daily points on a ~600px chart is unreadable, so the 3-month view is
 * grouped into weeks.
 */
const SALES_RANGES: Record<string, { days: number; bucket: "day" | "week" }> = {
  "7d": { days: 7, bucket: "day" },
  "15d": { days: 15, bucket: "day" },
  "30d": { days: 30, bucket: "day" },
  "3m": { days: 90, bucket: "week" },
};

const DEFAULT_RANGE = "15d";

/** Midnight local time, so day buckets line up with calendar days. */
function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const supabase = createAdminSupabaseClient();

    // 1. Get total revenue (paid orders only), total orders, average order value
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("total, payment_status, order_status, created_at");

    if (ordersErr) {
      console.error("Error fetching orders for stats:", ordersErr);
      return NextResponse.json({ error: "Could not load dashboard statistics." }, { status: 500 });
    }

    /**
     * A checkout that was started but never paid for.
     *
     * An order row exists before payment, so every dismissed payment modal
     * leaves one behind. Counting those as orders overstated the order count
     * and buried real cancellations in the status breakdown, so they are
     * reported separately as a funnel number instead.
     */
    const isAbandoned = (o: { payment_status: string; order_status: string }) =>
      o.payment_status === "failed" && o.order_status === "cancelled";

    const abandonedCheckouts = orders.filter(isAbandoned).length;
    const realOrders = orders.filter((o) => !isAbandoned(o));

    const totalOrders = realOrders.length;
    const paidOrders = realOrders.filter((o) => o.payment_status === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // 2. Count total customers
    const { count: customerCount, error: customerErr } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (customerErr) {
      console.error("Error fetching customer count:", customerErr);
      return NextResponse.json({ error: "Could not load dashboard statistics." }, { status: 500 });
    }

    // 3. Status breakdown
    // Built from real orders only, so "cancelled" means an order someone
    // cancelled rather than a payment nobody finished.
    const statusBreakdown = {
      pending: realOrders.filter((o) => o.order_status === "pending").length,
      confirmed: realOrders.filter((o) => o.order_status === "confirmed").length,
      processing: realOrders.filter((o) => o.order_status === "processing").length,
      shipped: realOrders.filter((o) => o.order_status === "shipped").length,
      delivered: realOrders.filter((o) => o.order_status === "delivered").length,
      cancelled: realOrders.filter((o) => o.order_status === "cancelled").length,
    };

    // 4. Group sales over the requested window for the chart.
    //
    // Buckets are keyed by an ISO date string rather than a display label:
    // a formatted label like "02 Mar" repeats across years and would collapse
    // two different days into one bucket on a 3-month view.
    const { searchParams } = new URL(request.url);
    const rangeKey = searchParams.get("range") || DEFAULT_RANGE;
    const range = SALES_RANGES[rangeKey] ?? SALES_RANGES[DEFAULT_RANGE];

    const bucketDays = range.bucket === "week" ? 7 : 1;
    const bucketCount = Math.ceil(range.days / bucketDays);

    const today = startOfDay(new Date());
    const buckets: { key: string; start: Date; end: Date; revenue: number; orders: number }[] = [];

    // Buckets are anchored so the last one *ends* today rather than starting
    // today. Anchoring on the start would leave the final weekly bucket holding
    // a single day, so the 3-month chart always finished on a false dip.
    for (let i = bucketCount - 1; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - (i * bucketDays + bucketDays - 1));
      const end = new Date(start);
      end.setDate(end.getDate() + bucketDays);
      buckets.push({ key: start.toISOString().slice(0, 10), start, end, revenue: 0, orders: 0 });
    }

    const windowStart = buckets.length > 0 ? buckets[0].start : today;

    realOrders.forEach((o) => {
      const placed = new Date(o.created_at);
      if (placed < windowStart) return;

      // Integer division locates the bucket directly — no scan per order.
      // Rounded, not floored: both sides are local midnights, so the quotient is
      // a whole number of days except across a DST boundary, where flooring
      // 83.96 would push an order back into the previous bucket.
      const dayOffset = Math.round(
        (startOfDay(placed).getTime() - windowStart.getTime()) / 86_400_000
      );
      const index = Math.floor(dayOffset / bucketDays);
      const bucket = buckets[index];
      if (!bucket) return;

      bucket.orders += 1;
      if (o.payment_status === "paid") {
        bucket.revenue += Number(o.total);
      }
    });

    const salesHistory = buckets.map((b) => ({
      date: b.start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: Math.round(b.revenue),
      orders: b.orders,
    }));

    // 5. Get top selling products (aggregate order items)
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("product_id, quantity, price, products(title)");

    if (itemsErr) {
      console.error("Error fetching order items for top products:", itemsErr);
    }

    const productSalesMap: { [id: string]: { name: string; quantity: number; revenue: number } } = {};
    if (orderItems) {
      orderItems.forEach((item: any) => {
        const prodId = item.product_id;
        const qty = item.quantity;
        const rev = Number(item.price) * qty;
        const prodName = item.products?.title || "Unknown Product";

        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = { name: prodName, quantity: 0, revenue: 0 };
        }
        productSalesMap[prodId].quantity += qty;
        productSalesMap[prodId].revenue += rev;
      });
    }

    const topProducts = Object.entries(productSalesMap)
      .map(([id, data]) => ({
        id,
        name: data.name,
        quantity: data.quantity,
        revenue: Math.round(data.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        abandonedCheckouts,
        averageOrderValue: Math.round(averageOrderValue),
        totalCustomers: customerCount || 0,
        statusBreakdown,
        salesHistory,
        salesRange: rangeKey in SALES_RANGES ? rangeKey : DEFAULT_RANGE,
        salesBucket: range.bucket,
        topProducts,
      },
    });
  } catch (error: any) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Could not load dashboard statistics." }, { status: 500 });
  }
}
