import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { SANITY_CACHE_TAG } from "@/lib/sanity";
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Sanity publish webhook → drop the storefront's cached catalog.
 *
 * Without this, a publish in Studio only showed up once the time-based backstop
 * expired, which is why edits appeared not to take effect. Sanity calls this
 * endpoint the moment a document changes and the next page request rebuilds
 * from fresh data.
 *
 * Configure in Sanity → API → Webhooks:
 *   URL      https://gorermart.in/api/revalidate/sanity
 *   Dataset  production
 *   Trigger  Create, Update, Delete
 *   Filter   _type in ["product","category","collection","homePage","aboutPage","loginPage"]
 *   Secret   must equal SANITY_REVALIDATE_SECRET
 *   HTTP     POST, API version v2021-03-25
 */
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  if (!secret) {
    return apiError("Revalidation is not configured.", 500, {
      scope: "revalidate.sanity",
      cause: "SANITY_REVALIDATE_SECRET is not set",
    });
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  if (!signature) {
    return apiError("Missing signature.", 401);
  }

  // The raw body must be verified exactly as received — re-encoding the JSON
  // can change byte order or spacing and break the signature.
  const body = await request.text();

  let valid = false;
  try {
    valid = await isValidSignature(body, signature, secret);
  } catch (error) {
    console.error("[revalidate.sanity] signature check threw", error);
    return apiError("Invalid signature.", 401);
  }

  if (!valid) {
    console.warn("[revalidate.sanity] rejected an invalidly signed request");
    return apiError("Invalid signature.", 401);
  }

  // Everything shares one tag: products carry category fields, and the home page
  // embeds products, so any publish can affect any page.
  //
  // `{ expire: 0 }` rather than the usual "max" profile: this is a webhook, not a
  // Server Action, and "max" would serve the first visitor after a publish stale
  // content while revalidating behind them — which is the exact symptom being
  // fixed. Expiring immediately makes that next request block briefly and return
  // the new content.
  revalidateTag(SANITY_CACHE_TAG, { expire: 0 });

  let documentType: string | undefined;
  let documentId: string | undefined;
  try {
    const payload = JSON.parse(body);
    documentType = payload?._type;
    documentId = payload?._id;
  } catch {
    // The tag was already revalidated; payload details are only for the log.
  }

  console.info(
    `[revalidate.sanity] revalidated "${SANITY_CACHE_TAG}"` +
      (documentType ? ` after ${documentType} change (${documentId ?? "unknown id"})` : "")
  );

  return NextResponse.json({
    revalidated: true,
    tag: SANITY_CACHE_TAG,
    documentType: documentType ?? null,
  });
}

/** Sanity sends a GET when you use "Test webhook" in the dashboard. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Sanity revalidation endpoint. Send a signed POST to revalidate.",
  });
}
