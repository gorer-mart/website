import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";

    const supabase = createAdminSupabaseClient();

    // Query all users and fetch their orders to compute order statistics
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        *,
        orders (
          id,
          total,
          payment_status
        ),
        addresses (
          id,
          full_name,
          phone,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          landmark,
          is_default
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch admin customers error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let customerStats = (users || []).map((user: any) => {
      const orders = user.orders || [];
      const ordersCount = orders.length;
      const paidOrders = orders.filter((o: any) => o.payment_status === "paid");
      const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

      return {
        id: user.id,
        fullName: user.full_name || "Anonymous Customer",
        email: user.email,
        phone: user.phone || "—",
        avatarUrl: user.avatar_url || null,
        role: user.role,
        createdAt: user.created_at,
        ordersCount,
        totalSpent: Math.round(totalSpent),
        addresses: user.addresses || []
      };
    });

    // Apply search filter if requested
    if (search) {
      customerStats = customerStats.filter(
        (c) =>
          c.fullName.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      customers: customerStats,
    });
  } catch (error: any) {
    console.error("GET customers API error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
