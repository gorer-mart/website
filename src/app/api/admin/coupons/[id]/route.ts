import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Delete a promo code.
 *
 * A code that has already been redeemed is deactivated instead of removed:
 * `coupon_redemptions` and `orders.coupon_id` reference it, and a paid order
 * must keep showing which promotion it used. Only unused codes are truly
 * deleted, which is what the admin means by "remove this draft".
 */
export async function DELETE(
  _request: Request,
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
    if (!id) return apiError("A promo code id is required.", 400);

    const supabase = createAdminSupabaseClient();

    const { count, error: countError } = await supabase
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", id);

    if (countError) {
      return apiError("Could not remove the promo code.", 500, {
        scope: "admin.coupons.DELETE.count",
        cause: countError,
      });
    }

    if ((count ?? 0) > 0) {
      const { error: deactivateError } = await supabase
        .from("coupons")
        .update({ is_active: false })
        .eq("id", id);

      if (deactivateError) {
        return apiError("Could not deactivate the promo code.", 500, {
          scope: "admin.coupons.DELETE.deactivate",
          cause: deactivateError,
        });
      }

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `This code has been used ${count} time${count === 1 ? "" : "s"}, so it was deactivated rather than deleted. Past orders keep their record.`,
      });
    }

    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      return apiError("Could not remove the promo code.", 500, {
        scope: "admin.coupons.DELETE",
        cause: error,
      });
    }

    return NextResponse.json({ success: true, deactivated: false });
  } catch (error) {
    return apiError("Could not remove the promo code.", 500, {
      scope: "admin.coupons.DELETE",
      cause: error,
    });
  }
}
