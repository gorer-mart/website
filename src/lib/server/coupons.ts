import type { SupabaseClient } from "@supabase/supabase-js";
import { toMoney, type PricedLine } from "@/lib/server/pricing";

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
  /** Sanity collection ids the code is limited to. Null means whole catalogue. */
  collection_ids: string[] | null;
  /** Display snapshot parallel to `collection_ids`. */
  collection_names: string[] | null;
}

/** The server-priced bag a coupon is judged against. */
export interface CouponCart {
  subtotal: number;
  lines: PricedLine[];
}

export type CouponEvaluation =
  | {
      ok: true;
      coupon: CouponRow;
      /** Rupees to subtract from the subtotal. */
      discount: number;
      /** Subtotal minus discount, floored at zero. */
      payable: number;
      /**
       * Portion of the subtotal the discount was actually computed on. Equals
       * the cart subtotal for an unscoped code.
       */
      eligibleSubtotal: number;
    }
  | { ok: false; reason: string };

/** Codes are stored and compared upper-case, so casing never matters. */
export function normaliseCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Is this code limited to particular collections?
 *
 * An empty array is treated as unscoped rather than "matches nothing". The
 * database constraint rejects empty arrays, so this only guards against rows
 * written before that constraint existed — where the safe reading is the old
 * behaviour, not silently refusing every cart.
 */
export function isCollectionScoped(
  coupon: Pick<CouponRow, "collection_ids">
): boolean {
  return Array.isArray(coupon.collection_ids) && coupon.collection_ids.length > 0;
}

/** Human-readable list of the scoped collections, e.g. "Top Picks and Winter Specials". */
function describeScope(coupon: CouponRow): string {
  const names = (coupon.collection_names ?? []).filter(Boolean);
  if (names.length === 0) return "selected collections";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Subtotal of the cart lines a coupon may discount.
 *
 * For a collection-scoped code this is the sum of only those lines whose
 * product belongs to one of the scoped collections — so "20% off Winter
 * Specials" never discounts the cotton kurta sitting next to it in the bag.
 */
export function eligibleSubtotalFor(coupon: CouponRow, cart: CouponCart): number {
  if (!isCollectionScoped(coupon)) return cart.subtotal;

  const scoped = new Set(coupon.collection_ids ?? []);

  let eligible = 0;
  for (const line of cart.lines) {
    const memberships = line.product.collectionIds ?? [];
    if (memberships.some((id) => scoped.has(id))) {
      eligible += line.unitPrice * line.quantity;
    }
  }

  return toMoney(eligible);
}

/**
 * Discount a coupon is worth against a given base amount.
 *
 * `base` is the eligible subtotal, not necessarily the cart subtotal — see
 * `eligibleSubtotalFor`. Percentage coupons respect `max_discount_amount` when
 * one is set. Either kind is capped at the base, so an over-generous fixed
 * coupon can reduce the eligible items to zero but never below it, and can
 * never eat into items the promotion does not cover.
 */
export function calculateDiscount(coupon: CouponRow, base: number): number {
  const value = Number(coupon.discount_value) || 0;

  let discount = coupon.discount_type === "percentage" ? (base * value) / 100 : value;

  if (coupon.discount_type === "percentage" && coupon.max_discount_amount != null) {
    discount = Math.min(discount, Number(coupon.max_discount_amount));
  }

  discount = Math.min(discount, base);
  return toMoney(Math.max(0, discount));
}

/** Human-readable summary, e.g. "20% off (up to ₹500) on Top Picks". */
export function describeCoupon(coupon: CouponRow): string {
  const scope = isCollectionScoped(coupon) ? ` on ${describeScope(coupon)}` : "";

  if (coupon.discount_type === "percentage") {
    const cap = coupon.max_discount_amount
      ? ` (up to ₹${Number(coupon.max_discount_amount).toLocaleString("en-IN")})`
      : "";
    return `${Number(coupon.discount_value)}% off${cap}${scope}`;
  }
  return `₹${Number(coupon.discount_value).toLocaleString("en-IN")} off${scope}`;
}

/**
 * Validate a code for one customer and cart, and price the discount.
 *
 * Takes the whole priced cart rather than just its subtotal, because a
 * collection-scoped code has to know *which* lines it may discount, not only
 * how much the bag came to.
 *
 * Failure messages are written to be shown directly to the customer, and are
 * deliberately specific about *why* a code did not apply — "add ₹300 more" is
 * actionable, "invalid code" is not.
 */
export async function evaluateCoupon(
  supabase: SupabaseClient,
  rawCode: string,
  cart: CouponCart,
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

  const row = coupon as CouponRow;
  const scoped = isCollectionScoped(row);

  // What this code is allowed to discount. For a scoped code the minimum-order
  // test and the discount arithmetic both run against this figure, so "spend
  // ₹999 on Winter Specials for 20% off Winter Specials" reads consistently
  // and an expensive ineligible item cannot unlock the promotion.
  const eligibleSubtotal = eligibleSubtotalFor(row, cart);

  if (scoped && eligibleSubtotal <= 0) {
    return {
      ok: false,
      reason: `This code only applies to ${describeScope(row)}. Your bag has nothing from ${
        (row.collection_names ?? []).length > 1 ? "those collections" : "that collection"
      }.`,
    };
  }

  const minOrder = Number(coupon.min_order_value) || 0;
  if (eligibleSubtotal < minOrder) {
    const shortfall = toMoney(minOrder - eligibleSubtotal);
    const qualifier = scoped ? ` of ${describeScope(row)}` : "";
    return {
      ok: false,
      reason: `Add ₹${shortfall.toLocaleString("en-IN")} more${qualifier} to use this code (minimum ₹${minOrder.toLocaleString("en-IN")}).`,
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

  const discount = calculateDiscount(row, eligibleSubtotal);

  if (discount <= 0) {
    return { ok: false, reason: "That promo code does not apply to your bag." };
  }

  return {
    ok: true,
    coupon: row,
    discount,
    // Taken off the whole bag, even when the discount was sized from a subset.
    payable: toMoney(Math.max(0, cart.subtotal - discount)),
    eligibleSubtotal,
  };
}
