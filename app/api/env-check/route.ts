import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime  = 'nodejs';

/**
 * GET /api/env-check
 *
 * Read-only diagnostic that lists which Supabase-related env var NAMES
 * Vercel is providing to this serverless function, and sanitised peeks
 * at their values. Safe to expose because:
 *   - It never reveals service-role or anon key contents (only length
 *     and the first/last 4 chars of the URL host).
 *   - It only flags whether each value looks real or placeholder.
 *
 * Hit this URL in a browser after deploying:
 *   https://<your-vercel-domain>/api/env-check
 */
export async function GET() {
  // 1. All env keys that look like they could be Supabase-related —
  //    catches typos such as SUPBASE / SUPERBASE / etc.
  const allKeys = Object.keys(process.env);
  const supabaseShaped = allKeys.filter((k) =>
    /SUP|BASE/i.test(k) && /(URL|KEY|ROLE|ANON|SECRET)/i.test(k)
  ).sort();

  // 2. Exact lookups for the three we expect
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? '';
  const anon       = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY     ?? '';

  function peek(s: string): string {
    if (!s) return '(empty)';
    if (s.length < 20) return s;
    return s.slice(0, 14) + '…' + s.slice(-6);
  }

  function classify(s: string): 'real' | 'placeholder' | 'empty' {
    if (!s) return 'empty';
    if (/placeholder|your-project|your-anon|your-service|xxxx/i.test(s)) {
      return 'placeholder';
    }
    return 'real';
  }

  return NextResponse.json({
    expected_vars: {
      NEXT_PUBLIC_SUPABASE_URL: {
        status: classify(url),
        length: url.length,
        peek:   peek(url),
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        status: classify(anon),
        length: anon.length,
        peek:   peek(anon),
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        status: classify(serviceKey),
        length: serviceKey.length,
        peek:   peek(serviceKey),
      },
    },
    matching_env_var_names_on_this_server: supabaseShaped,
    note:
      'If "matching_env_var_names_on_this_server" lists a name like ' +
      '"NEXT_PUBLIC_SUPBASE_URL" (missing an A) instead of the expected ' +
      'spelling, that\'s your typo. Fix it in Vercel → Settings → ' +
      'Environment Variables and redeploy.',
  });
}
