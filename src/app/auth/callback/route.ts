import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * Auth callback route handler
 *
 * Handles email verification redirects from Supabase.
 * When a user clicks the verification link in their email,
 * Supabase redirects them here with an auth code.
 *
 * Flow:
 * 1. User clicks email verification link
 * 2. Supabase redirects to: /auth/callback?code=xxx
 * 3. This route extracts the code
 * 4. Client-side Supabase (detectSessionInUrl: true) exchanges code for session
 * 5. Redirect to onboarding/dashboard
 *
 * @see https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle error from Supabase (e.g., expired link, invalid token)
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // If we have a code, let the client-side Supabase handle it
  // The supabase client has detectSessionInUrl: true in lib/supabaseClient.ts,
  // so it will automatically exchange the code for a session when the page loads
  if (code) {
    // Redirect to onboarding profile setup
    // The protected layout will check if onboarding is complete
    // and redirect to /app if already onboarded
    return NextResponse.redirect(`${requestUrl.origin}/onboarding/profile`);
  }

  // No code and no error - something's wrong, redirect to login
  console.warn('Auth callback called without code or error');
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
