import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";
import { cartItemSchema, MAX_LINES, priceCart } from "@/lib/server/pricing";
import { describeCoupon, evaluateCoupon } from "@/lib/server/coupons";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().trim().min(1, "Please enter a promo code.").max(60),
  cartItems: z.array(cartItemSchema).min(1).max(MAX_LINES),
});

/**
 * Price a promo code against the customer's bag, without committing anything.
 *
 * Used by the checkout form to show the discount before payment. Nothing here
 * reserves or redeems the code — usage is only counted once an order is
 * actually paid for — so the code is validated again during order creation.
 *
 * The subtotal is recomputed from the catalog rather than taken from the
 * request, so a tampered cart cannot inflate a percentage discount.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to use a promo code.", 401);
  }

  // Coupon codes are guessable by nature; throttle so this cannot be used to
  // enumerate valid codes.
  const limit = hit(`validate-coupon:${user.id}`, 20, 5 * 60 * 1000);
  const limited = rateLimitResponse(
    limit,
    "Too many promo code attempts. Please wait a moment and try again."
  );
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Please enter a promo code.", 400);
  }

  const { code, cartItems } = parsed.data;

  try {
    const pricing = await priceCart(cartItems);
    if (!pricing.ok) {
      return apiError(pricing.message, pricing.status);
    }

    const supabase = createAdminSupabaseClient();
    const result = await evaluateCoupon(supabase, code, pricing.subtotal, user.id);

    if (!result.ok) {
      // 200 with `valid: false`: the request was well-formed, the code simply
      // does not apply. The form shows `reason` inline rather than as an error.
      return NextResponse.json({ success: true, valid: false, reason: result.reason });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        code: result.coupon.code,
        description: result.coupon.description,
        summary: describeCoupon(result.coupon),
      },
      subtotal: pricing.subtotal,
      discount: result.discount,
      total: result.payable,
    });
  } catch (error) {
    return apiError("We could not check that code right now. Please try again.", 500, {
      scope: "validate-coupon",
      cause: error,
    });
  }
}

/** Not used by the app; present so a stray GET does not 405 noisily. */
export async function GET() {
  return NextResponse.json({ ok: true, message: "POST a code and cart to validate a promo code." });
}
