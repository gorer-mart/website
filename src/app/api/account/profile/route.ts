import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Saved contact details and delivery address for the signed-in customer.
 *
 * Checkout calls this to pre-fill the form on a repeat order, so a returning
 * customer does not retype an address they have already given us.
 *
 * Every query is scoped by the user id resolved from the session cookie, never
 * from anything the client sends.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to view your details.", 401);
  }

  try {
    const supabase = createAdminSupabaseClient();

    const [{ data: profile }, { data: addresses }] = await Promise.all([
      supabase.from("users").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
      supabase
        .from("addresses")
        .select(
          "id, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const list = addresses || [];
    // The default address wins; otherwise fall back to the most recently used.
    const defaultAddress = list.find((a) => a.is_default) || list[0] || null;

    return NextResponse.json({
      success: true,
      profile: {
        fullName: profile?.full_name || "",
        email: profile?.email || user.email || "",
        // The profile column is authoritative, but accounts that ordered before
        // checkout began writing it still have the number on their address.
        phone: String(profile?.phone || "").trim() || String(defaultAddress?.phone || "").trim(),
      },
      defaultAddress,
      addresses: list,
    });
  } catch (error) {
    console.error("GET account profile API error:", error);
    return apiError("Could not load your saved details.", 500);
  }
}
