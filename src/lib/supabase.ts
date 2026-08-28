/**
 * Deprecated module — kept as a signpost.
 *
 * This file used to export a `supabase` singleton built with
 * `@supabase/supabase-js`'s `createClient`, which persists the session to
 * **localStorage**. The server (route handlers and src/proxy.ts) can only read
 * **cookies**, so a browser session created that way was invisible to the
 * backend and every authenticated API call — including the whole checkout —
 * returned 401.
 *
 * Always use the cookie-backed client instead:
 *
 *   import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
 *
 * Server-side, use `createServerSupabaseClient` (user-scoped, respects RLS) or
 * `createAdminSupabaseClient` (service role, bypasses RLS — guard the caller).
 */
export { createBrowserSupabaseClient } from "./supabase/browser";
