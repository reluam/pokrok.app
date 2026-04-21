import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for admin API routes.
 * Bypasses RLS — never expose this client to the browser.
 */

let cached: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) not set');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return cached;
}
