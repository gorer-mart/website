import { NextResponse } from "next/server";

/**
 * Best-effort client IP. On Vercel `x-forwarded-for` is set by the edge and the
 * left-most entry is the real client; behind other proxies it may be spoofable,
 * so this is only ever used for coarse abuse throttling — never for authz.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Error response that never echoes database/driver internals back to a caller.
 * Log the real cause server-side; return a stable, human-readable message.
 */
export function apiError(
  message: string,
  status: number,
  logContext?: { scope: string; cause?: unknown }
) {
  if (logContext?.cause !== undefined) {
    console.error(`[${logContext.scope}]`, logContext.cause);
  }
  return NextResponse.json({ error: message }, { status });
}

/** Parse a JSON body, returning null instead of throwing on malformed input. */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
