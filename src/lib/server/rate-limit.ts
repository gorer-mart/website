/**
 * Fixed-window in-memory rate limiter.
 *
 * Scope note: state lives in the process, so on serverless each instance keeps
 * its own counters and they reset on cold start. That is enough to blunt casual
 * scripted abuse (form spam, checkout hammering) and adds no infrastructure.
 * For hard guarantees across instances, swap `hit()` for a Redis/Upstash
 * INCR+EXPIRE — every call site already goes through this one function.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  // Amortised cleanup so the map cannot grow without bound.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Convenience wrapper that returns a 429 Response when the limit is exceeded. */
export function rateLimitResponse(result: RateLimitResult, message: string) {
  if (result.ok) return null;
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSeconds),
    },
  });
}
