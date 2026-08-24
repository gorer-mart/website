/**
 * Sanity CDN image delivery.
 *
 * The catalog previously rendered `urlFor(img).url()` with no transform at all,
 * which makes Sanity serve the untouched original — measured at ~124 KB of JPEG
 * for a product image displayed in a ~300 px card that needs ~22 KB of WebP.
 * These helpers attach the width/quality/format parameters the CDN needs so
 * each `<img>` downloads roughly what it actually paints.
 *
 * `auto=format` is the important one: it makes the CDN negotiate WebP/AVIF per
 * browser instead of falling back to JPEG.
 */

/** Widths for a product card in a responsive grid (2-up mobile → 4-up desktop). */
export const CARD_WIDTHS = [240, 320, 400, 560, 720];

/** Widths for the large product-detail gallery image. */
export const DETAIL_WIDTHS = [420, 600, 800, 1000, 1280];

/** Widths for a full-bleed hero. */
export const HERO_WIDTHS = [640, 960, 1280, 1600, 1920, 2400];

/**
 * Append transform params to a Sanity CDN URL.
 *
 * The incoming URL may already carry a query string — `urlFor()` emits
 * `?rect=…` whenever an image has a crop set in Studio — so the separator has
 * to be chosen rather than assumed, otherwise the crop is silently dropped.
 */
export function sizedImageUrl(
  url: string | undefined | null,
  width: number,
  quality = 75
): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("cdn.sanity.io")) return url; // local/static asset — leave alone

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}w=${width}&q=${quality}&auto=format&fit=max`;
}

/** Build a `srcSet` string so the browser picks the cheapest sufficient file. */
export function imageSrcSet(
  url: string | undefined | null,
  widths: number[] = CARD_WIDTHS,
  quality = 75
): string {
  if (!url || typeof url !== "string" || !url.includes("cdn.sanity.io")) return "";
  return widths.map((w) => `${sizedImageUrl(url, w, quality)} ${w}w`).join(", ");
}

/**
 * Normalise the several shapes a product image can arrive in.
 *
 * Cart entries persisted in localStorage before this change hold plain URL
 * strings, and some older records hold `{ src }` objects, so both must keep
 * working — a customer with a full bag must not see broken thumbnails.
 */
export function resolveImageUrl(image: unknown): string {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object") {
    const candidate = image as { src?: unknown; url?: unknown };
    if (typeof candidate.src === "string") return candidate.src;
    if (typeof candidate.url === "string") return candidate.url;
  }
  return "";
}

/**
 * Props for an `<img>` that downloads only what it displays.
 *
 * `sizes` should describe the element's painted width at each breakpoint;
 * without it the browser assumes 100vw and over-downloads on every card.
 */
export function imageProps(
  image: unknown,
  {
    widths = CARD_WIDTHS,
    sizes,
    quality = 75,
    fallbackWidth,
  }: { widths?: number[]; sizes: string; quality?: number; fallbackWidth?: number }
): { src: string; srcSet?: string; sizes?: string } {
  const url = resolveImageUrl(image);
  if (!url) return { src: "" };

  const base = fallbackWidth ?? widths[Math.floor(widths.length / 2)];
  const srcSet = imageSrcSet(url, widths, quality);

  return srcSet
    ? { src: sizedImageUrl(url, base, quality), srcSet, sizes }
    : { src: url };
}
