/**
 * Environment and URL utilities
 * Centralized configuration for site URLs across environments
 */

/**
 * Get the base URL for the application
 * Works in both development and production
 *
 * Priority order:
 * 1. NEXT_PUBLIC_SITE_URL (explicit override)
 * 2. NEXT_PUBLIC_VERCEL_URL (Vercel auto-injected)
 * 3. localhost:3000 (development fallback)
 *
 * @returns The base URL without trailing slash
 *
 * @example
 * ```ts
 * const redirectUrl = `${getSiteUrl()}/auth/callback`;
 * // Production: https://cimer-sable.vercel.app/auth/callback
 * // Development: http://localhost:3000/auth/callback
 * ```
 */
export function getSiteUrl(): string {
  // 1. Check for explicit site URL env var (production override)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 2. Check for Vercel auto-injected URL (production/preview)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 3. Fallback to localhost (development)
  return 'http://localhost:3000';
}

/**
 * Get the auth callback URL for Supabase redirects
 *
 * @returns Full callback URL
 *
 * @example
 * ```ts
 * const callbackUrl = getAuthCallbackUrl();
 * // https://cimer-sable.vercel.app/auth/callback
 * ```
 */
export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}
