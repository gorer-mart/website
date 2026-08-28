import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { apiError, getClientIp, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.email("Please enter a valid email address").trim().toLowerCase().max(254),
});

export async function POST(request: Request) {
  const limit = hit(`newsletter:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  const limited = rateLimitResponse(limit, "Too many subscription attempts. Please try again later.");
  if (limited) return limited;

  const body = await readJson(request);
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Please enter a valid email address.", 400);
  }

  const { email } = parsed.data;

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });

  if (error) {
    // 23505 = unique_violation. Treat an existing subscriber as success so the
    // endpoint cannot be used to enumerate who is already on the list.
    if (error.code === "23505") {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }
    return apiError("Could not complete your subscription. Please try again.", 500, {
      scope: "newsletter.subscribe",
      cause: error,
    });
  }

  return NextResponse.json({ success: true, alreadySubscribed: false });
}
