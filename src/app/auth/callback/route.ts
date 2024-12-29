import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
      // Redirect to login page with success message
      return NextResponse.redirect(new URL('/login?verified=true', requestUrl.origin));
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // Redirect to login page with error message
      return NextResponse.redirect(new URL('/login?error=verification_failed', requestUrl.origin));
    }
  }

  // If no code, redirect to home page
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 