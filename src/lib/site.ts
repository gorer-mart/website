/**
 * Canonical site origin.
 *
 * Set NEXT_PUBLIC_SITE_URL in the deployment environment. The fallback matches
 * the production domain so metadata, sitemap and robots stay consistent — the
 * previous static public/robots.txt and public/sitemap.xml pointed at
 * gorermart.com (wrong TLD) and shadowed the generated routes entirely.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://gorermart.in'
).replace(/\/$/, '');
