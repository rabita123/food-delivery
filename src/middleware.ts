import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  if (!session && (
    req.nextUrl.pathname.startsWith('/profile') ||
    req.nextUrl.pathname.startsWith('/admin') ||
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/order-preview') ||
    req.nextUrl.pathname.startsWith('/api/create-payment-intent')
  )) {
    const redirect = encodeURIComponent(req.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?redirect=${redirect}`, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/admin/:path*',
    '/auth/callback',
    '/dashboard/:path*',
    '/order-preview',
    '/payment',
    '/api/create-payment-intent'
  ],
}; 