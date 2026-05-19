import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SearchBar }  from '@/components/SearchBar';
import { SheetCard }  from '@/components/SheetCard';
import { getRecentSheets, getPopularSearches } from '@/lib/search';
import type { LanguageCode } from '@/lib/types';

export const metadata: Metadata = {
  title: 'LittleSeed — Free Bible Coloring Sheets for Children & Missionaries',
  description:
    'Search and download free printable Bible coloring sheets in English, Korean, Spanish, French, and Portuguese. Perfect for Sunday school and missionaries.',
};

// Revalidate once per hour — fresh data without full SSR overhead
export const revalidate = 3600;

interface HomePageProps {
  searchParams: { lang?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const lang = (searchParams.lang ?? 'en') as LanguageCode;

  // Both fetches run in parallel
  const [sheets, keywords] = await Promise.all([
    getRecentSheets(lang, 8),
    getPopularSearches(lang === 'en' ? 'en' : 'en'), // popular searches always in English for now
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* ── Hero search block ── */}
      <section aria-labelledby="search-heading" className="text-center mb-10">
        <h1
          id="search-heading"
          className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight"
        >
          Bible Coloring Sheets
        </h1>
        <p className="text-gray-500 mb-7 text-base sm:text-lg">
          Free &amp; printable — for children, Sunday school &amp; missionaries worldwide
        </p>

        {/* Search input — client component wrapped in Suspense */}
        <div className="max-w-2xl mx-auto mb-5">
          <Suspense>
            <SearchBar
              placeholder="Search Bible stories, verses, themes…"
              autoFocus
            />
          </Suspense>
        </div>

        {/* Popular keyword chips */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2" aria-label="Popular searches">
            <span className="text-sm text-gray-500 self-center">Popular:</span>
            {keywords.map((kw) => (
              <Link
                key={kw}
                href={`/search?q=${encodeURIComponent(kw)}`}
                className="inline-block px-3 py-1.5 rounded-full border border-gray-300
                           text-sm text-gray-700 bg-white hover:border-blue-400
                           hover:text-blue-600 hover:bg-blue-50"
                style={{ minHeight: 36 }}
              >
                {kw}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-gray-500 border-y border-gray-100 py-4">
        <span>✓ 100% Free</span>
        <span>✓ Printable PDF &amp; SVG</span>
        <span>✓ 5 Languages</span>
        <span>✓ Works Offline</span>
      </div>

      {/* ── Recent sheets grid ── */}
      {sheets.length > 0 && (
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="recent-heading"
              className="text-xl font-semibold text-gray-900"
            >
              Recently Added
            </h2>
            <Link
              href="/search"
              className="text-sm text-blue-600 hover:underline"
              style={{ minHeight: 36, display: 'flex', alignItems: 'center' }}
            >
              Browse all →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sheets.map((sheet) => (
              <SheetCard key={sheet.id} sheet={sheet} />
            ))}
          </div>
        </section>
      )}

      {/* ── Missionary blurb ── */}
      <section
        aria-label="About LittleSeed"
        className="mt-14 p-6 bg-blue-50 rounded-xl border border-blue-100"
      >
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          For Missionaries &amp; Sunday School Teachers
        </h2>
        <p className="text-blue-800 text-sm leading-relaxed">
          Every sheet is free to download, print, and use without restriction.
          Translated verse text is included for local-language ministry.
          Lightweight files load quickly even on slow internet connections.
        </p>
        <Link
          href="/about"
          className="inline-block mt-3 text-sm font-medium text-blue-700 hover:underline"
          style={{ minHeight: 36 }}
        >
          Learn more →
        </Link>
      </section>
    </div>
  );
}
