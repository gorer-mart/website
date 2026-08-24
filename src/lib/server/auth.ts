import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Resolve the caller from the request cookies.
 *
 * `getUser()` (not `getSession()`) is deliberate: it revalidates the JWT with
 * the auth server instead of trusting a cookie the client controls.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user ?? null;
  } catch (error) {
    console.error("[auth.getAuthenticatedUser]", error);
    return null;
  }
}

export type AdminCheck =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403 };

/**
 * Authorize an admin-only request.
 *
 * The proxy (src/proxy.ts) already gates /admin and /api/admin, but every
 * privileged handler re-checks here as well. Middleware is a single layer that
 * can be bypassed by routing quirks or framework CVEs, and these handlers run
 * with the service-role key — which ignores RLS entirely — so the check has to
 * live next to the data access, not only in front of it.
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, status: 401 };

  // Role lookup goes through the service-role client: the `users` RLS policy
  // only exposes a caller's own row, and we must not depend on that shape here.
  const admin = createAdminSupabaseClient();
  const { data: profile, error } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[auth.requireAdmin] role lookup failed", error);
    return { ok: false, status: 403 };
  }

  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403 };
  }

  return { ok: true, user };
}
