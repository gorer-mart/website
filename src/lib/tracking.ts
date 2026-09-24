/**
 * Courier tracking links — one definition of "valid", shared by both ends.
 *
 * The admin route uses `normalizeTrackingUrl` to decide what gets stored, and
 * the orders page uses it again before putting the value in an `href`. The
 * second check is deliberate, not redundant: rows predating the column's CHECK
 * constraint, or written by a backfill, must never turn into a clickable
 * `javascript:` URL on a customer's screen.
 */

/** Matches the CHECK constraint on `orders.tracking_url`. */
export const TRACKING_URL_MAX_LENGTH = 2048;

/** The only schemes that may ever reach an `href`. */
const WEB_PROTOCOLS = new Set(["http:", "https:"]);

/** `scheme://` prefix — the port in `example.com:8080/x` must not match. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Parse admin input into a storable tracking link, or `null` if it is not one.
 *
 * Empty input normalises to `null`, which is how the field is cleared. A bare
 * host (`delhivery.com/track/123`) is assumed to be `https://` — that is what
 * an admin gets when they copy a courier's address bar without the scheme, and
 * rejecting it would only teach them to retype it.
 */
export function normalizeTrackingUrl(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (raw.length > TRACKING_URL_MAX_LENGTH) return null;

  const candidate = HAS_SCHEME.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (!WEB_PROTOCOLS.has(url.protocol)) return null;
  // No courier link carries credentials, and `user:pass@host` is worth
  // rejecting on its own: it is the classic URL-spoofing shape, and it is how
  // a pasted `mailto:ops@courier.com` would otherwise survive the scheme
  // prefix as `https://mailto:ops@courier.com`.
  if (url.username || url.password) return null;
  // A courier link is always a public host. This also rejects the junk that
  // survives parsing once the scheme is prepended, e.g. `https://javascript`.
  if (!url.hostname.includes(".")) return null;

  const normalized = url.toString();
  return normalized.length <= TRACKING_URL_MAX_LENGTH ? normalized : null;
}
