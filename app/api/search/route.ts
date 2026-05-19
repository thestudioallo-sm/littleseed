import { NextRequest, NextResponse } from 'next/server';
import { searchSheets } from '@/lib/search';
import type { AgeGroup, Difficulty, LanguageCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=Noah&lang=en&age=early&diff=easy&page=1
 *
 * Used for instant search suggestions (client-side fetch).
 * Returns a lean payload — only what the UI needs.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const q        = (searchParams.get('q')    ?? '').trim();
  const lang     = (searchParams.get('lang') ?? 'en') as LanguageCode;
  const age      = searchParams.get('age')  as AgeGroup   | null;
  const diff     = searchParams.get('diff') as Difficulty  | null;
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  if (q.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  try {
    const { results } = await searchSheets({
      q,
      lang,
      age:        age  ?? undefined,
      difficulty: diff ?? undefined,
      page,
    });

    // Slim response for the API consumer
    const slim = results.map((r) => ({
      slug:          r.slug,
      title:         r.title ?? r.bible_story,
      verse:         r.verse,
      thumbnail_url: r.thumbnail_url,
      age_group:     r.age_group,
      difficulty:    r.difficulty,
    }));

    return NextResponse.json(
      { results: slim, count: slim.length },
      {
        headers: {
          // Cache for 1 minute at CDN edge
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('[/api/search] Error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
