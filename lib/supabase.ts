import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

if (
  process.env.NODE_ENV === 'production' &&
  supabaseUrl.includes('placeholder')
) {
  throw new Error('Missing Supabase environment variables in production.');
}

/**
 * Browser / server-component client (uses anon key, respects RLS).
 * In dev mode with placeholder credentials, all calls will fail gracefully
 * and lib/search.ts will fall back to mock data automatically.
 */
export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: false },
});

/**
 * Admin client — server-side only. Falls back to anon key if service
 * role key is not set (safe for local dev since mock mode is used instead).
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnon,
  { auth: { persistSession: false } }
);
