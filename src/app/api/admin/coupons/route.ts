import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { normaliseCode } from "@/lib/server/coupons";

export const dynamic = "force-dynamic";

/**
 * Admin CRUD for promo codes.
 *
 * Validation mirrors the database constraints in `015_coupons.sql` so the admin
 * gets a readable message instead of a raw Postgres error.
 */
const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters.")
    .max(40, "Code is too long.")
    // Codes are typed by customers, so keep them unambiguous.
    .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens and underscores."),
  description: z.string().trim().max(300).optional().nullable(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive("Discount must be greater than zero."),
  max_discount_amount: z.coerce.number().positive().optional().nullable(),
  min_order_value: z.coerce.number().min(0).optional().default(0),
  usage_limit: z.coerce.number().int().positive().optional().nullable(),
  per_user_limit: z.coerce.number().int().positive().optional().nullable(),
  starts_at: z.string().trim().min(1).optional().nullable(),
  expires_at: z.string().trim().min(1).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

/** Shared checks the database also enforces, surfaced with better wording. */
function validateBusinessRules(input: z.infer<typeof couponSchema>): string | null {
  if (input.discount_type === "percentage" && input.discount_value > 100) {
    return "A percentage discount cannot exceed 100%.";
  }
  if (input.starts_at && input.expires_at) {
    if (new Date(input.expires_at).getTime() <= new Date(input.starts_at).getTime()) {
      return "The end date must be after the start date.";
    }
  }
  return null;
}

function toRow(input: z.infer<typeof couponSchema>) {
  return {
    code: normaliseCode(input.code),
    description: input.description?.trim() || null,
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    // A cap only means something for percentage coupons.
    max_discount_amount:
      input.discount_type === "percentage" ? input.max_discount_amount ?? null : null,
    min_order_value: input.min_order_value ?? 0,
    usage_limit: input.usage_limit ?? null,
    per_user_limit: input.per_user_limit ?? null,
    starts_at: input.starts_at || null,
    expires_at: input.expires_at || null,
    is_active: input.is_active ?? true,
  };
}

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

    const { data: coupons, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return apiError("Could not load promo codes.", 500, {
        scope: "admin.coupons.GET",
        cause: error,
      });
    }

    // Revenue given away per code, so the admin can see what a promotion cost.
    const { data: redemptions } = await supabase
      .from("coupon_redemptions")
      .select("coupon_id, discount_amount");

    const totals = new Map<string, { uses: number; discounted: number }>();
    for (const row of redemptions || []) {
      const current = totals.get(row.coupon_id) || { uses: 0, discounted: 0 };
      current.uses += 1;
      current.discounted += Number(row.discount_amount) || 0;
      totals.set(row.coupon_id, current);
    }

    return NextResponse.json({
      success: true,
      coupons: (coupons || []).map((c) => ({
        ...c,
        redeemed_count: totals.get(c.id)?.uses ?? 0,
        total_discounted: Math.round(totals.get(c.id)?.discounted ?? 0),
      })),
    });
  } catch (error) {
    return apiError("Could not load promo codes.", 500, {
      scope: "admin.coupons.GET",
      cause: error,
    });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  const parsed = couponSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Please check the promo code details.", 400);
  }

  const ruleError = validateBusinessRules(parsed.data);
  if (ruleError) return apiError(ruleError, 400);

  try {
    const supabase = createAdminSupabaseClient();
    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert(toRow(parsed.data))
      .select()
      .single();

    if (error) {
      // 23505 is unique_violation — the only conflict a well-formed payload hits.
      if (error.code === "23505") {
        return apiError("A promo code with that name already exists.", 409);
      }
      return apiError("Could not create the promo code.", 500, {
        scope: "admin.coupons.POST",
        cause: error,
      });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    return apiError("Could not create the promo code.", 500, {
      scope: "admin.coupons.POST",
      cause: error,
    });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  const body = await readJson<Record<string, unknown>>(request);
  const couponId = typeof body?.id === "string" ? body.id : "";
  if (!couponId) {
    return apiError("A promo code id is required.", 400);
  }

  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Please check the promo code details.", 400);
  }

  const ruleError = validateBusinessRules(parsed.data);
  if (ruleError) return apiError(ruleError, 400);

  try {
    const supabase = createAdminSupabaseClient();
    const { data: coupon, error } = await supabase
      .from("coupons")
      .update(toRow(parsed.data))
      .eq("id", couponId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return apiError("A promo code with that name already exists.", 409);
      }
      return apiError("Could not update the promo code.", 500, {
        scope: "admin.coupons.PUT",
        cause: error,
      });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    return apiError("Could not update the promo code.", 500, {
      scope: "admin.coupons.PUT",
      cause: error,
    });
  }
}
