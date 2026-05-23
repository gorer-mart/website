import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware: Custom subdomain routing for Gorer Mart
 *
 * Routing logic:
 * ┌─────────────────────────────────┬──────────────────────────────┐
 * │ Incoming Request                │ Internal Rewrite             │
 * ├─────────────────────────────────┼──────────────────────────────┤
 * │ studio.gorermart.in/            │ /studio                     │
 * │ studio.gorermart.in/structure   │ /studio/structure            │
 * │ studio.gorermart.in/anything    │ /studio/anything             │
 * │ gorermart.in/*                  │ No rewrite (pass through)    │
 * │ localhost:3000/*                │ No rewrite (pass through)    │
 * └─────────────────────────────────┴──────────────────────────────┘
 *
 * Key behaviors:
 * - The browser URL stays as `studio.gorermart.in/...` (no visible redirect)
 * - Storefront on `gorermart.in` is completely unaffected
 * - Static assets, images, favicon, and API routes are excluded from middleware
 * - Local development (`localhost`) is never intercepted
 */

const STUDIO_HOSTNAME = 'studio.gorermart.in';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Strip port number for local testing comparisons (e.g. "studio.gorermart.in:3000")
  const cleanHostname = hostname.split(':')[0];

  // Only intercept requests to the studio subdomain
  if (cleanHostname !== STUDIO_HOSTNAME) {
    return NextResponse.next();
  }

  // Get the current pathname (e.g. "/" or "/structure" or "/structure/homePage")
  const pathname = request.nextUrl.pathname;

  // If the path already starts with /studio, let it pass through to avoid rewrite loops
  // This handles Sanity's internal navigation and asset loading
  if (pathname.startsWith('/studio')) {
    return NextResponse.next();
  }

  // Rewrite: studio.gorermart.in/{path} → /studio/{path}
  // NextResponse.rewrite() performs an internal URL rewrite — the browser URL does NOT change
  const url = request.nextUrl.clone();
  url.pathname = `/studio${pathname}`;

  return NextResponse.rewrite(url);
}

/**
 * Matcher configuration:
 * - Excludes Next.js internal routes (_next/static, _next/image)
 * - Excludes favicon.ico and other static files
 * - Excludes API routes (/api/*)
 * - Matches everything else for subdomain detection
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/).*)',
  ],
};
