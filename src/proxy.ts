import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const STUDIO_HOSTNAME = 'studio.gorermart.in';

/**
 * Paths that must never pay for a session lookup.
 * The Razorpay webhook in particular is signature-authenticated and called by
 * Razorpay, not by a browser — touching auth there only adds latency and risk.
 */
const BYPASS_PREFIXES = ['/api/webhook', '/_next', '/favicon', '/robots.txt', '/sitemap.xml'];

function createClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, getResponse: () => response };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isAdminLogin = pathname === '/admin/login';

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables in proxy');
    if (isAdminPath && !isAdminLogin) {
      return pathname.startsWith('/api/admin')
        ? NextResponse.json({ error: 'Internal configuration error' }, { status: 500 })
        : NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  const { supabase, getResponse } = createClient(request);

  // IMPORTANT: `getUser()` revalidates the JWT with the auth server.
  // `getSession()` would trust a cookie the client fully controls.
  // Calling it here also refreshes an expiring session and writes the rotated
  // cookies onto the response — without this a customer's token can expire
  // mid-checkout and the order APIs start returning 401.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---- Admin gate ------------------------------------------------------
  // Defence in depth only: every /api/admin handler re-checks the admin role
  // itself, because those handlers run with the service-role key.
  if (isAdminPath && !isAdminLogin) {
    let isAuthorized = false;

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      isAuthorized = profile?.role === 'admin';
    }

    if (!isAuthorized) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // ---- Sanity Studio subdomain routing ---------------------------------
  const hostname = (request.headers.get('host') || '').split(':')[0];
  if (hostname === STUDIO_HOSTNAME && !pathname.startsWith('/studio')) {
    const url = request.nextUrl.clone();
    url.pathname = `/studio${pathname}`;
    return NextResponse.rewrite(url);
  }

  return getResponse();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - common static asset extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
};
