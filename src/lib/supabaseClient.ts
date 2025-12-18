import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Supabase configuration from environment variables
// Note: NEXT_PUBLIC_SUPABASE_ANON_KEY should contain the PUBLISHABLE key (not the secret key)
// The publishable key starts with "eyJ..." or "sb_publishable_..."
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable (use the publishable key, not the secret key)');
}

// Security check: Warn if using secret key instead of publishable key
if (supabaseAnonKey.startsWith('sb_secret_')) {
  console.error('⚠️ SECURITY WARNING: You are using the SECRET KEY in NEXT_PUBLIC_SUPABASE_ANON_KEY!');
  console.error('This key should NEVER be used in client-side code.');
  console.error('Please use the PUBLISHABLE KEY instead (starts with "eyJ..." or "sb_publishable_...")');
  throw new Error('Forbidden use of secret API key in browser. Use the publishable key instead.');
}

/**
 * Supabase client for client-side usage (browser)
 *
 * This client is typed with the Database schema and can be used
 * in React components, hooks, and client-side utilities.
 *
 * Usage:
 * ```tsx
 * import { supabase } from '@/lib/supabaseClient';
 *
 * const { data, error } = await supabase
 *   .from('cmr_documents')
 *   .select('*')
 *   .eq('user_id', userId);
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Get the Supabase client instance
 *
 * This function is provided for consistency with other patterns,
 * but you can also import `supabase` directly.
 *
 * @returns Typed Supabase client
 */
export function getSupabaseClient() {
  return supabase;
}

/**
 * Type exports for convenience
 */
export type { Database };
