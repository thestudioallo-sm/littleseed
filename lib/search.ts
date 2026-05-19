import { supabase } from './supabase';
import type {
  SearchParams,
  SearchResult,
  SheetDetail,
  LanguageCode,
} from './types';
import {
  MOCK_SHEETS,
  MOCK_POPULAR_SEARCHES,
  MOCK_DETAIL,
} from './mock-data';

const PAGE_SIZE = 18;

// ── dev-mode helper: returns true when Supabase is a placeholder ──────────
function isMockMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  );
}

// ============================================================
// Full-text search via Supabase RPC (falls back to mock)
// ============================================================

export async function searchSheets(params: SearchParams): Promise<{
  results: SearchResult[];
  total: number;
}> {
  const { q, lang = 'en', age, difficulty, page = 1 } = params;

  // ── Mock fallback ──────────────────────────────────────────
  if (isMockMode()) {
    const q_lower = q.toLowerCase();
    const filtered = MOCK_SHEETS.filter((s) => {
      if (age && s.age_group !== age) return false;
      if (difficulty && s.difficulty !== difficulty) return false;
      if (!q_lower) return true;
      return (
        s.bible_story.toLowerCase().includes(q_lower) ||
        s.title?.toLowerCase().includes(q_lower) ||
        s.tags.some((t) => t.toLowerCase().includes(q_lower)) ||
        s.verse?.toLowerCase().includes(q_lower)
      );
    });
    const offset = (page - 1) * PAGE_SIZE;
    return { results: filtered.slice(offset, offset + PAGE_SIZE), total: filtered.length };
  }

  // ── Real Supabase path ─────────────────────────────────────
  const offset = (page - 1) * PAGE_SIZE;

  const { data, error } = await supabase.rpc('search_coloring_pages', {
    query_text:   q || '',
    lang_code:    lang,
    p_age_group:  age       ?? null,
    p_difficulty: difficulty ?? null,
    p_limit:      PAGE_SIZE,
    p_offset:     offset,
  });

  if (error) {
    console.error('[search] RPC error:', error.message);
    return { results: [], total: 0 };
  }

  return {
    results: (data ?? []) as SearchResult[],
    total:   (data ?? []).length,
  };
}

// ============================================================
// Fetch a single sheet with all translations (falls back to mock)
// ============================================================

export async function getSheetBySlug(
  slug: string,
  lang: LanguageCode = 'en'
): Promise<SheetDetail | null> {

  // ── Mock fallback ──────────────────────────────────────────
  if (isMockMode()) {
    if (slug === MOCK_DETAIL.slug) return MOCK_DETAIL;
    const found = MOCK_SHEETS.find((s) => s.slug === slug);
    if (!found) return null;
    return {
      ...found,
      bible_book:       null,
      bible_chapter:    null,
      bible_verse:      null,
      pdf_url:          found.svg_url.replace('.svg', '.pdf'),
      is_published:     true,
      created_at:       new Date().toISOString(),
      translation: {
        id:               `tr-${slug}-${lang}`,
        coloring_page_id: found.id,
        language_code:    lang,
        title:            found.title ?? found.bible_story,
        verse:            found.verse ?? '',
        description:      null,
        keywords:         found.tags,
      },
      all_translations: [
        { language_code: 'en', title: found.title ?? found.bible_story },
        { language_code: 'ko', title: found.title ?? found.bible_story },
        { language_code: 'es', title: found.title ?? found.bible_story },
      ],
    };
  }

  // ── Real Supabase path ─────────────────────────────────────
  const { data: page, error: pageError } = await supabase
    .from('coloring_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (pageError || !page) return null;

  const { data: translation } = await supabase
    .from('translations')
    .select('*')
    .eq('coloring_page_id', page.id)
    .eq('language_code', lang)
    .maybeSingle();

  const { data: allTranslations } = await supabase
    .from('translations')
    .select('language_code, title')
    .eq('coloring_page_id', page.id);

  return {
    ...page,
    translation:      translation ?? null,
    all_translations: allTranslations ?? [],
  } as SheetDetail;
}

// ============================================================
// Recent / featured sheets (homepage)
// ============================================================

export async function getRecentSheets(
  lang: LanguageCode = 'en',
  limit = 8
): Promise<SearchResult[]> {

  if (isMockMode()) {
    return MOCK_SHEETS.slice(0, limit);
  }

  const { data, error } = await supabase
    .from('coloring_pages')
    .select(`
      id, slug, bible_story, age_group, difficulty,
      thumbnail_url, svg_url, tags,
      translations!inner(title, verse, language_code)
    `)
    .eq('is_published', true)
    .eq('translations.language_code', lang)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id:            row.id,
    slug:          row.slug,
    bible_story:   row.bible_story,
    age_group:     row.age_group,
    difficulty:    row.difficulty,
    thumbnail_url: row.thumbnail_url,
    svg_url:       row.svg_url,
    tags:          row.tags,
    title:         row.translations?.[0]?.title ?? row.bible_story,
    verse:         row.translations?.[0]?.verse  ?? null,
    rank:          0,
  })) as SearchResult[];
}

// ============================================================
// Popular search keywords (homepage chips)
// ============================================================

export async function getPopularSearches(lang = 'en'): Promise<string[]> {
  if (isMockMode()) {
    return MOCK_POPULAR_SEARCHES;
  }

  const { data } = await supabase
    .from('popular_searches')
    .select('keyword')
    .eq('lang_code', lang)
    .order('sort_order');

  return (data ?? []).map((r: { keyword: string }) => r.keyword);
}
