import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/account';

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      console.error('OAuth code exchange error:', error.message);
    } catch (err) {
      console.error('OAuth callback execution error:', err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
