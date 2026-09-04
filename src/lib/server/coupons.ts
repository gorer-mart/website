import type { SupabaseClient } from "@supabase/supabase-js";
import { toMoney } from "@/lib/server/pricing";

/**
 * Coupon validation and discount arithmetic.
 *
 * This is the only place that decides whether a code applies and what it is
 * worth. The checkout preview endpoint and order creation both call it, so the
 * amount a customer is quoted is derived by exactly the same code that sets the
 * amount they are charged.
 *
 * Never trusts anything from the browser: the code is looked up fresh, and the
 * subtotal is always the server-computed one from `priceCart`.
 */

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount: number | null;
  min_order_value: number;
  usage_limit: number | null;
  per_user_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export type CouponEvaluation =
  | {
      ok: true;
      coupon: CouponRow;
      /** Rupees to subtract from the subtotal. */
      discount: number;
      /** Subtotal minus discount, floored at zero. */
      payable: number;
    }
  | { ok: false; reason: string };

/** Codes are stored and compared upper-case, so casing never matters. */
export function normaliseCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Discount a coupon is worth against a given subtotal.
 *
 * Percentage coupons respect `max_discount_amount` when one is set. Either kind
 * is capped at the subtotal, so an over-generous fixed coupon can reduce an
 * order to zero but never below it.
 */
export function calculateDiscount(coupon: CouponRow, subtotal: number): number {
  const value = Number(coupon.discount_value) || 0;

  let discount =
    coupon.discount_type === "percentage" ? (subtotal * value) / 100 : value;

  if (coupon.discount_type === "percentage" && coupon.max_discount_amount != null) {
    discount = Math.min(discount, Number(coupon.max_discount_amount));
  }

  discount = Math.min(discount, subtotal);
  return toMoney(Math.max(0, discount));
}

/** Human-readable summary, e.g. "20% off (up to ₹500)". */
export function describeCoupon(coupon: CouponRow): string {
  if (coupon.discount_type === "percentage") {
    const cap = coupon.max_discount_amount
      ? ` (up to ₹${Number(coupon.max_discount_amount).toLocaleString("en-IN")})`
      : "";
    return `${Number(coupon.discount_value)}% off${cap}`;
  }
  return `₹${Number(coupon.discount_value).toLocaleString("en-IN")} off`;
}

/**
 * Validate a code for one customer and cart, and price the discount.
 *
 * Failure messages are written to be shown directly to the customer, and are
 * deliberately specific about *why* a code did not apply — "add ₹300 more" is
 * actionable, "invalid code" is not.
 */
export async function evaluateCoupon(
  supabase: SupabaseClient,
  rawCode: string,
  subtotal: number,
  userId: string
): Promise<CouponEvaluation> {
  const code = normaliseCode(rawCode);
  if (!code) {
    return { ok: false, reason: "Please enter a promo code." };
  }

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[coupons] lookup failed", error);
    return { ok: false, reason: "We could not check that code right now. Please try again." };
  }

  // An inactive or unknown code gets the same message on purpose: revealing
  // that a code exists but is switched off invites probing.
  if (!coupon || !coupon.is_active) {
    return { ok: false, reason: "That promo code is not valid." };
  }

  const now = Date.now();

  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ok: false, reason: "That promo code is not active yet." };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) {
    return { ok: false, reason: "That promo code has expired." };
  }

  const minOrder = Number(coupon.min_order_value) || 0;
  if (subtotal < minOrder) {
    const shortfall = toMoney(minOrder - subtotal);
    return {
      ok: false,
      reason: `Add ₹${shortfall.toLocaleString("en-IN")} more to use this code (minimum order ₹${minOrder.toLocaleString("en-IN")}).`,
    };
  }

  if (coupon.usage_limit != null && Number(coupon.usage_count) >= Number(coupon.usage_limit)) {
    return { ok: false, reason: "This promo code has been fully claimed." };
  }

  if (coupon.per_user_limit != null) {
    const { count, error: countError } = await supabase
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId);

    if (countError) {
      console.error("[coupons] redemption count failed", countError);
      return { ok: false, reason: "We could not check that code right now. Please try again." };
    }

    if ((count ?? 0) >= Number(coupon.per_user_limit)) {
      return { ok: false, reason: "You have already used this promo code." };
    }
  }

  const discount = calculateDiscount(coupon as CouponRow, subtotal);

  if (discount <= 0) {
    return { ok: false, reason: "That promo code does not apply to your bag." };
  }

  return {
    ok: true,
    coupon: coupon as CouponRow,
    discount,
    payable: toMoney(Math.max(0, subtotal - discount)),
  };
}
