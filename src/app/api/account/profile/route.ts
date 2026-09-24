import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";
import { listAddresses } from "@/lib/server/addresses";

export const dynamic = "force-dynamic";

/**
 * Saved contact details and delivery address for the signed-in customer.
 *
 * Checkout calls this to pre-fill the form on a repeat order, so a returning
 * customer does not retype an address they have already given us. The account
 * page uses it to render and edit the same details.
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
      supabase
        .from("users")
        .select("full_name, email, phone, avatar_url, created_at")
        .eq("id", user.id)
        .maybeSingle(),
      // Archived addresses are excluded, so checkout never pre-fills one the
      // customer has removed from their address book.
      listAddresses(supabase, user.id),
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
        avatarUrl: profile?.avatar_url || "",
        memberSince: profile?.created_at || user.created_at || null,
      },
      defaultAddress,
      addresses: list,
    });
  } catch (error) {
    console.error("GET account profile API error:", error);
    return apiError("Could not load your saved details.", 500);
  }
}

/**
 * Contact details the customer may change about themselves.
 *
 * Email is deliberately absent: it is the identity the Supabase Auth session
 * is issued against, so changing it belongs to an auth flow with re-verification,
 * not to a profile form.
 */
const patchSchema = z.object({
  fullName: z
    .string({ error: "Please enter your name" })
    .trim()
    .min(1, "Please enter your name")
    .max(120, "That name is too long"),
  phone: z
    .union([
      z.literal(""),
      z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
    ])
    .optional()
    .default(""),
});

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to update your details.", 401);
  }

  const limited = rateLimitResponse(
    hit(`profile-write:${user.id}`, 20, 10 * 60 * 1000),
    "Too many profile changes. Please wait a moment."
  );
  if (limited) return limited;

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Those details are incomplete.", 400);
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: updated, error } = await supabase
      .from("users")
      .update({
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("full_name, email, phone, avatar_url")
      .single();

    if (error || !updated) {
      return apiError("Could not save your details.", 500, {
        scope: "account.profile.PATCH",
        cause: error,
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        fullName: updated.full_name || "",
        email: updated.email || user.email || "",
        phone: updated.phone || "",
        avatarUrl: updated.avatar_url || "",
      },
    });
  } catch (error) {
    return apiError("Could not save your details.", 500, {
      scope: "account.profile.PATCH",
      cause: error,
    });
  }
}
