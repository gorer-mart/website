import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const STUDIO_HOSTNAME = 'studio.gorermart.in';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to the admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 1. Check for Admin Access Control
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (isAdminPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables in proxy');
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Internal configuration error' }, { status: 500 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAuthorized = false;
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && profile.role === 'admin') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Redirect unauthorized page views to admin login page
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return supabaseResponse;
  }

  // 2. Original Subdomain Routing (Sanity Studio Proxy)
  const hostname = request.headers.get('host') || '';
  const cleanHostname = hostname.split(':')[0];

  if (cleanHostname !== STUDIO_HOSTNAME) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/studio')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/studio${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
