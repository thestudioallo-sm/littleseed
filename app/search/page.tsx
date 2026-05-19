import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchBar }  from '@/components/SearchBar';
import { SheetCard }  from '@/components/SheetCard';
import { FilterBar }  from '@/components/FilterBar';
import { searchSheets } from '@/lib/search';
import type { AgeGroup, Difficulty, LanguageCode } from '@/lib/types';

interface SearchPageProps {
  searchParams: {
    q?:    string;
    lang?: string;
    age?:  string;
    diff?: string;
    page?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const q = searchParams.q ?? '';
  return {
    title: q ? `"${q}" — Bible Coloring Sheets` : 'Browse Bible Coloring Sheets',
    description: q
      ? `Free printable Bible coloring sheets for "${q}". Download PDF or print now.`
      : 'Browse all free printable Bible coloring sheets for children and missionaries.',
  };
}

// Search results are dynamic — no static cache
export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q        = (searchParams.q    ?? '').trim();
  const lang     = (searchParams.lang ?? 'en') as LanguageCode;
  const age      = searchParams.age  as AgeGroup   | undefined;
  const diff     = searchParams.diff as Difficulty  | undefined;
  const page     = Math.max(1, parseInt(searchParams.page ?? '1', 10));

  const { results } = await searchSheets({
    q,
    lang,
    age,
    difficulty: diff,
    page,
  });

  const hasQuery = q.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Search bar */}
      <div className="mb-5">
        <Suspense>
          <SearchBar initialValue={q} />
        </Suspense>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      {/* Results heading */}
      <div className="mb-4">
        {hasQuery ? (
          <p className="text-gray-700 text-sm">
            {results.length > 0
              ? <>Showing <strong>{results.length}</strong> results for <strong>&ldquo;{q}&rdquo;</strong></>
              : <>No results for <strong>&ldquo;{q}&rdquo;</strong></>
            }
          </p>
        ) : (
          <p className="text-gray-700 text-sm font-medium">All Sheets</p>
        )}
      </div>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {results.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <svg
            className="mx-auto mb-4 text-gray-300"
            width="48" height="48" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-1">No sheets found</p>
          <p className="text-sm">Try a different keyword — Noah, Easter, Love, David…</p>
        </div>
      )}
    </div>
  );
}
