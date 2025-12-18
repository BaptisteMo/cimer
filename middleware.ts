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
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
