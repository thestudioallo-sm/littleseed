import type { Metadata } from 'next';
import { notFound }      from 'next/navigation';
import { Suspense }      from 'react';
import Link              from 'next/link';
import { getSheetBySlug } from '@/lib/search';
import { LanguageSelector } from '@/components/LanguageSelector';
import { PrintButton }      from '@/components/PrintButton';
import type { LanguageCode } from '@/lib/types';
import { AGE_GROUP_LABELS, DIFFICULTY_LABELS, SUPPORTED_LANGUAGES } from '@/lib/types';

interface SheetPageProps {
  params:       { slug: string };
  searchParams: { lang?: string };
}

// Static generation with short ISR: revalidate every 60s so DB updates
// (e.g. svg_url / pdf_url changes) propagate quickly to the static page.
export const revalidate = 60;

export async function generateMetadata({
  params, searchParams,
}: SheetPageProps): Promise<Metadata> {
  const lang  = (searchParams.lang ?? 'en') as LanguageCode;
  const sheet = await getSheetBySlug(params.slug, lang);
  if (!sheet) return { title: 'Sheet not found' };

  const t = sheet.translation;
  return {
    title:       t?.title ?? sheet.bible_story,
    description: t?.verse
      ? t.verse.slice(0, 160)
      : `Free printable Bible coloring sheet: ${sheet.bible_story}`,
    openGraph: {
      title:  t?.title ?? sheet.bible_story,
      images: sheet.thumbnail_url ? [sheet.thumbnail_url] : [],
    },
  };
}

export default async function SheetPage({ params, searchParams }: SheetPageProps) {
  const lang  = (searchParams.lang ?? 'en') as LanguageCode;
  const sheet = await getSheetBySlug(params.slug, lang);

  if (!sheet) notFound();

  const t               = sheet.translation;
  const title           = t?.title ?? sheet.bible_story;
  const verse           = t?.verse ?? '';
  const description     = t?.description ?? '';
  // Always show all 9 languages; fall back to English if no translation exists
  const availableLangs = SUPPORTED_LANGUAGES.map(l => l.code as LanguageCode);

  return (
    <>
      {/* ── Print-only header ── */}
      <div className="hidden print:block text-center mb-4">
        <p className="text-lg font-bold">{title}</p>
        {verse && <p className="text-sm mt-1 max-w-sm mx-auto">{verse}</p>}
        <p className="text-xs text-gray-400 mt-1">littleseed.app</p>
      </div>

      {/* ── Screen layout ── */}
      <div className="no-print max-w-4xl mx-auto px-4 py-6">

        {/* Back link */}
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
          style={{ minHeight: 40 }}
        >
          ← Back to search
        </Link>

        <div className="grid md:grid-cols-[1fr_300px] gap-6">

          {/* ── SVG Preview ── */}
          <div>
            <div
              className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden print-page"
              style={{ aspectRatio: '3/4' }}
            >
              {/* Image embed — works for both SVG and raster (PNG/JPG/WebP) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sheet.svg_url}
                alt={`Coloring sheet: ${title}`}
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>

            {/* Verse under SVG (visible on screen) */}
            {verse && (
              <blockquote
                className="verse-text mt-4 px-4 py-3 border-l-4 border-blue-400
                           bg-blue-50 text-sm text-gray-700 rounded-r-lg italic leading-relaxed"
              >
                {verse}
              </blockquote>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="flex flex-col gap-4">

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">{title}</h1>
              {sheet.bible_book && (
                <p className="text-sm text-gray-500 mt-1">
                  {sheet.bible_book}
                  {sheet.bible_verse ? ` ${sheet.bible_verse}` : ''}
                </p>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                {AGE_GROUP_LABELS[sheet.age_group]}
              </span>
              <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {DIFFICULTY_LABELS[sheet.difficulty]}
              </span>
              <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                Free
              </span>
            </div>

            {/* Language selector — always show all 9 languages */}
            <div>
              <Suspense>
                <LanguageSelector
                  currentLang={lang}
                  availableLangs={availableLangs}
                />
              </Suspense>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-2">
              {/* PDF download */}
              {sheet.pdf_url && (
                <a
                  href={sheet.pdf_url}
                  download
                  className="flex items-center justify-center gap-2 px-4 py-3
                             rounded-lg bg-blue-600 text-white font-semibold text-sm
                             hover:bg-blue-700 active:bg-blue-800"
                  style={{ minHeight: 52 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </a>
              )}

              {/* Print or Save as PDF (via browser print dialog) */}
              <PrintButton label="Print or Save as PDF" />
            </div>

            {/* Tags */}
            {sheet.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sheet.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200
                                 px-2 py-1 rounded"
                      style={{ minHeight: 32 }}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Image download (label adapts to file type) */}
            <div className="border-t border-gray-100 pt-3">
              <a
                href={sheet.svg_url}
                download
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                {sheet.svg_url.toLowerCase().endsWith('.svg')
                  ? 'Download SVG (vector)'
                  : 'Download image'}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
