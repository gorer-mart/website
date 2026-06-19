import { NextRequest, NextResponse } from 'next/server';

const STUDIO_HOSTNAME = 'studio.gorermart.in';

export function proxy(request: NextRequest) {
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/).*)',
  ],
};
