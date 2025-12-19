import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(_request: NextRequest) {
  const res = NextResponse.next();

  // For MVP, we handle auth checks in the components (client-side)
  // This middleware is a placeholder for future server-side auth enhancement
  // When using @supabase/ssr, you can add session refresh logic here

  return res;
}

export const config = {
  matcher: [
    /*
     * Match ONLY protected routes that require authentication:
     * - /app (dashboard)
     * - /cmr/* (CMR management pages)
     * - /profile (user profile)
     * - /onboarding/* (onboarding flow)
     *
     * PUBLIC routes (NOT matched, no auth required):
     * - / (landing page)
     * - /login, /signup (auth pages)
     * - /verify-email
     * - /api/* (API routes)
     * - /_next/*, /favicon.ico, etc. (static assets)
     */
    '/app/:path*',
    '/cmr/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
  ],
};
