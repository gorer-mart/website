import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { apiError, getClientIp, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

// Bounded lengths matter here: this endpoint is unauthenticated and writes to
// the database, so without them it is a free, unbounded storage sink.
const contactSchema = z.object({
  name: z.string({ error: "Please enter your name" }).trim().min(2, "Please enter your name").max(100, "That name is too long"),
  email: z
    .email({ error: "Please enter a valid email address" })
    .trim()
    .toLowerCase()
    .max(254, "That email address is too long"),
  phone: z
    .string({ error: "Please enter your phone number" })
    .trim()
    .min(6, "Please enter a valid phone number")
    .max(20, "Please enter a valid phone number"),
  subject: z.string({ error: "Please enter a subject" }).trim().min(2, "Please enter a subject").max(150, "That subject is too long"),
  message: z
    .string({ error: "Please enter a message" })
    .trim()
    .min(5, "Please enter a message")
    .max(4000, "Please keep your message under 4000 characters"),
});

export async function POST(request: Request) {
  const limit = hit(`contact:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  const limited = rateLimitResponse(
    limit,
    "You've sent several messages already. Please try again later."
  );
  if (limited) return limited;

  const parsed = contactSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Please check the form and try again.", 400);
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("contact_messages").insert(parsed.data);

  if (error) {
    return apiError("We couldn't send your message. Please try again.", 500, {
      scope: "contact.insert",
      cause: error,
    });
  }

  return NextResponse.json({ success: true });
}
