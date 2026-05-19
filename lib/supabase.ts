import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singletons — NOT created at module load time.
// This prevents Next.js build-time "collect page data" from failing
// when the module is imported but not yet executed in a request context.
let _supabase: SupabaseClient | undefined;
let _supabaseAdmin: SupabaseClient | undefined;

function url()  { return process.env.NEXT_PUBLIC_SUPABASE_URL       ?? 'https://placeholder.supabase.co'; }
function anon() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  ?? 'placeholder-anon-key'; }

/** Browser / server-component client (uses anon key, respects RLS). */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(url(), anon(), { auth: { persistSession: false } });
  }
  return _supabase;
}

/** Admin client — server-side only, bypasses RLS. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      url(),
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? anon(),
      { auth: { persistSession: false } }
    );
  }
  return _supabaseAdmin;
}
