import { NextRequest, NextResponse } from 'next/server';
import { getSheetBySlug } from '@/lib/search';
import type { LanguageCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sheets/:slug?lang=en
 *
 * Returns full sheet data as JSON — useful for:
 *  - PWA pre-caching (service worker)
 *  - Third-party integrations (church apps, etc.)
 *  - Future React Native / offline-sync clients
 */
export async function GET(
  req:     NextRequest,
  { params }: { params: { slug: string } }
) {
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'en') as LanguageCode;

  if (!/^[a-z0-9-]+$/.test(params.slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const sheet = await getSheetBySlug(params.slug, lang);

  if (!sheet) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Strip internal fields not needed by consumers
  const { is_published: _, ...rest } = sheet;

  return NextResponse.json(rest, {
    headers: {
      // Cache for 1 day at CDN — sheets change rarely
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
