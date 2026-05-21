import Link from 'next/link';
import type { SearchResult } from '@/lib/types';
import { AGE_GROUP_LABELS, DIFFICULTY_LABELS } from '@/lib/types';

interface SheetCardProps {
  sheet: SearchResult;
}

export function SheetCard({ sheet }: SheetCardProps) {
  const {
    slug, title, verse, thumbnail_url, svg_url,
    age_group, difficulty, bible_story,
  } = sheet;

  const displayTitle = title ?? bible_story;
  // Prefer the thumbnail, but fall back to the full SVG (good enough for a preview).
  // We use a plain <img> tag because Next.js' Image component refuses to render
  // SVG sources unless `dangerouslyAllowSVG` is set — and SVGs don't need
  // next/image optimisation anyway (they're already resolution-independent).
  const previewSrc = thumbnail_url ?? svg_url ?? null;

  return (
    <article className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-blue-400 transition-colors">
      <Link
        href={`/sheet/${slug}`}
        className="block no-underline"
        aria-label={`View coloring sheet: ${displayTitle}`}
      >
        {/* Thumbnail */}
        <div className="relative bg-gray-50 aspect-[3/4] overflow-hidden">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={`Preview of ${displayTitle}`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain p-3"
            />
          ) : (
            /* Fallback: inline SVG preview hint */
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
          )}
          {/* Free badge */}
          <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            Free
          </span>
        </div>

        {/* Text */}
        <div className="p-3">
          <h2 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
            {displayTitle}
          </h2>

          {verse && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
              {verse}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              {AGE_GROUP_LABELS[age_group]}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {DIFFICULTY_LABELS[difficulty]}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
