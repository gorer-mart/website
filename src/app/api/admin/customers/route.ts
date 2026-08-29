import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Newest-first by `created_at`; rows without one sort last. */
function newestFirst<T = any>(rows: T[]): T[] {
  return [...(rows || [])].sort(
    (a: any, b: any) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
  );
}

/**
 * Best known phone number for a customer.
 *
 * Preference order: the profile field, then the default address, then the most
 * recent address, then the most recent order. Checkout now writes the profile
 * field directly, so this fallback chain only matters for accounts that
 * ordered before that change.
 */
function resolveCustomerPhone(user: any): string {
  const direct = String(user?.phone || "").trim();
  if (direct) return direct;

  const addresses: any[] = user?.addresses || [];
  const defaultAddress = addresses.find((a) => a?.is_default && String(a.phone || "").trim());
  if (defaultAddress) return String(defaultAddress.phone).trim();

  const latestAddress = newestFirst(addresses).find((a) => String(a?.phone || "").trim());
  if (latestAddress) return String(latestAddress.phone).trim();

  const latestOrder = newestFirst(user?.orders || []).find((o: any) =>
    String(o?.customer_phone || "").trim()
  );
  if (latestOrder) return String(latestOrder.customer_phone).trim();

  return "";
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
          payment_status,
          customer_phone,
          created_at
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
          is_default,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch admin customers error:", error);
      return NextResponse.json({ error: "Could not load customers." }, { status: 500 });
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
        // `users.phone` is the canonical field, but accounts created before
        // checkout started writing it have it empty while the same number sits
        // on their address and order rows. Fall back through those so the
        // console shows the number the customer actually gave us.
        phone: resolveCustomerPhone(user) || "—",
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
    return NextResponse.json({ error: "Could not load customers." }, { status: 500 });
  }
}
