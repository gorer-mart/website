import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
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
    const statusBreakdown = {
      pending: orders.filter((o) => o.order_status === "pending").length,
      confirmed: orders.filter((o) => o.order_status === "confirmed").length,
      processing: orders.filter((o) => o.order_status === "processing").length,
      shipped: orders.filter((o) => o.order_status === "shipped").length,
      delivered: orders.filter((o) => o.order_status === "delivered").length,
      cancelled: orders.filter((o) => o.order_status === "cancelled").length,
    };

    // 4. Group sales over the last 14 days for the chart
    const dailySalesMap: { [date: string]: { revenue: number; orders: number } } = {};
    
    // Initialize past 14 days with 0s
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      dailySalesMap[dateStr] = { revenue: 0, orders: 0 };
    }

    orders.forEach((o) => {
      const oDate = new Date(o.created_at);
      const dateStr = oDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      
      if (dailySalesMap[dateStr] !== undefined) {
        dailySalesMap[dateStr].orders += 1;
        if (o.payment_status === "paid") {
          dailySalesMap[dateStr].revenue += Number(o.total);
        }
      }
    });

    const salesHistory = Object.entries(dailySalesMap).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders,
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
        averageOrderValue: Math.round(averageOrderValue),
        totalCustomers: customerCount || 0,
        statusBreakdown,
        salesHistory,
        topProducts,
      },
    });
  } catch (error: any) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Could not load dashboard statistics." }, { status: 500 });
  }
}
