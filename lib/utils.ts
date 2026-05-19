/**
 * Shared utility functions.
 * No external dependencies — pure TypeScript.
 */

import type { AgeGroup, Difficulty, LanguageCode } from './types';

// ── Slug helpers ──────────────────────────────────────────────

/** Convert any string to a URL-safe slug */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')                       // decompose accents
    .replace(/[̀-ͯ]/g, '')        // strip accent marks
    .replace(/[^a-z0-9]+/g, '-')           // non-alnum → hyphen
    .replace(/^-+|-+$/g, '');              // trim leading/trailing hyphens
}

// ── Language helpers ──────────────────────────────────────────

const LANG_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  ar: 'العربية',
  ps: 'پښتو',
  am: 'አማርኛ',
  mn: 'Монгол',
};

export function getLangName(code: LanguageCode): string {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

/** Detect preferred language from Accept-Language header */
export function detectLang(acceptLanguage: string | null): LanguageCode {
  if (!acceptLanguage) return 'en';
  const supported: LanguageCode[] = ['en', 'ko', 'es', 'fr', 'pt'];
  const preferred = acceptLanguage
    .split(',')
    .map((s) => s.split(';')[0].trim().slice(0, 2).toLowerCase());
  return (preferred.find((l) => supported.includes(l as LanguageCode)) as LanguageCode) ?? 'en';
}

// ── Age / difficulty label helpers ────────────────────────────

export const AGE_GROUP_SHORT: Record<AgeGroup, string> = {
  toddler:    '2–4',
  preschool:  '3–5',
  early:      '5–7',
  elementary: '7–10',
  tween:      '10–13',
  teen:       '13–18',
  adult:      '18+',
};

export const DIFFICULTY_STARS: Record<Difficulty, string> = {
  very_easy: '★☆☆☆',
  easy:      '★★☆☆',
  medium:    '★★★☆',
  detailed:  '★★★★',
};

// ── URL helpers ────────────────────────────────────────────────

/** Build a canonical asset URL, falling back to relative path */
export function assetUrl(relativePath: string): string {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!base) return relativePath;
  // relativePath is like /coloring/noah/noah-01.svg → strip leading /coloring/
  const stripped = relativePath.replace(/^\/coloring\//, '');
  return `${base}/${stripped}`;
}

/** Build /sheet/[slug] URL with optional lang param */
export function sheetUrl(slug: string, lang?: LanguageCode): string {
  const base = `/sheet/${slug}`;
  return lang && lang !== 'en' ? `${base}?lang=${lang}` : base;
}

// ── String helpers ─────────────────────────────────────────────

/** Truncate to n chars, appending ellipsis */
export function truncate(str: string, n: number): string {
  return str.length <= n ? str : str.slice(0, n - 1) + '…';
}

/** Capitalise first letter */
export function ucFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Date helpers ────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

// ── Class name helper (tiny, no clsx dependency) ────────────────

/** Merge class strings, filtering falsy values */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
