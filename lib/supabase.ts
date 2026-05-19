import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

// Note: missing env vars are handled gracefully at runtime via mock fallback in lib/search.ts
// Do NOT throw here — module-level throws break Next.js build-time route analysis.

/**
 * Browser / server-component client (uses anon key, respects RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: false },
});

/**
 * Admin client — server-side only.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnon,
  { auth: { persistSession: false } }
);
