'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { AgeGroup, Difficulty } from '@/lib/types';
import { AGE_GROUP_LABELS, DIFFICULTY_LABELS } from '@/lib/types';

export function FilterBar() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const currentAge  = searchParams.get('age')  as AgeGroup | null;
  const currentDiff = searchParams.get('diff')  as Difficulty | null;

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Age group filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filter-age" className="text-sm text-gray-600 shrink-0">
          Age
        </label>
        <select
          id="filter-age"
          value={currentAge ?? ''}
          onChange={(e) => setParam('age', e.target.value || null)}
          className="border border-gray-300 rounded-md px-2 py-1.5 text-sm
                     bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
          style={{ minHeight: 40 }}
        >
          <option value="">All ages</option>
          {(Object.entries(AGE_GROUP_LABELS) as [AgeGroup, string][]).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Difficulty filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filter-diff" className="text-sm text-gray-600 shrink-0">
          Level
        </label>
        <select
          id="filter-diff"
          value={currentDiff ?? ''}
          onChange={(e) => setParam('diff', e.target.value || null)}
          className="border border-gray-300 rounded-md px-2 py-1.5 text-sm
                     bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
          style={{ minHeight: 40 }}
        >
          <option value="">All levels</option>
          {(Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {(currentAge || currentDiff) && (
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('age');
            params.delete('diff');
            params.delete('page');
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="text-sm text-blue-600 hover:underline"
          style={{ minHeight: 40 }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
