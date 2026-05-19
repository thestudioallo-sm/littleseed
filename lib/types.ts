// ============================================================
// Core domain types — mirror the Supabase schema
// ============================================================

export type AgeGroup =
  | 'toddler'
  | 'preschool'
  | 'early'
  | 'elementary'
  | 'tween'
  | 'teen'
  | 'adult';

export type Difficulty = 'very_easy' | 'easy' | 'medium' | 'detailed';

export type LanguageCode = 'en' | 'ko' | 'es' | 'fr' | 'pt' | 'ar' | 'ps' | 'am' | 'mn';

export interface Language {
  code: LanguageCode;
  native_name: string;
  english_name: string;
  sort_order: number;
}

export interface ColoringPage {
  id: string;
  slug: string;
  bible_story: string;
  bible_book: string | null;
  bible_chapter: number | null;
  bible_verse: string | null;
  age_group: AgeGroup;
  difficulty: Difficulty;
  svg_url: string;
  pdf_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
  is_published: boolean;
  created_at: string;
}

export interface Translation {
  id: string;
  coloring_page_id: string;
  language_code: LanguageCode;
  title: string;
  verse: string;
  description: string | null;
  keywords: string[];
}

/** Joined type returned by search_coloring_pages RPC */
export interface SearchResult {
  id: string;
  slug: string;
  bible_story: string;
  age_group: AgeGroup;
  difficulty: Difficulty;
  thumbnail_url: string | null;
  svg_url: string;
  tags: string[];
  title: string | null;       // from translation
  verse: string | null;       // from translation
  rank: number;
}

/** Full detail page data */
export interface SheetDetail extends ColoringPage {
  translation: Translation | null;
  all_translations: Pick<Translation, 'language_code' | 'title'>[];
}

// ============================================================
// Search params
// ============================================================

export interface SearchParams {
  q: string;
  lang?: LanguageCode;
  age?: AgeGroup;
  difficulty?: Difficulty;
  page?: number;
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  toddler:    'Toddler (2–4)',
  preschool:  'Preschool (3–5)',
  early:      'Early (5–7)',
  elementary: 'Elementary (7–10)',
  tween:      'Tween (10–13)',
  teen:       'Teen (13–18)',
  adult:      'Adult',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  very_easy: 'Very Easy',
  easy:      'Easy',
  medium:    'Medium',
  detailed:  'Detailed',
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', native_name: 'English',   english_name: 'English',    sort_order: 1 },
  { code: 'ko', native_name: '한국어',     english_name: 'Korean',     sort_order: 2 },
  { code: 'es', native_name: 'Español',   english_name: 'Spanish',    sort_order: 3 },
  { code: 'fr', native_name: 'Français',  english_name: 'French',     sort_order: 4 },
  { code: 'pt', native_name: 'Português', english_name: 'Portuguese', sort_order: 5 },
  { code: 'ar', native_name: 'العربية',   english_name: 'Arabic',     sort_order: 6 },
  { code: 'ps', native_name: 'پښتو',      english_name: 'Pashto',     sort_order: 7 },
  { code: 'am', native_name: 'አማርኛ',      english_name: 'Amharic',    sort_order: 8 },
  { code: 'mn', native_name: 'Монгол',    english_name: 'Mongolian',  sort_order: 9 },
];

/** Languages that render right-to-left */
export const RTL_LANGUAGES = new Set<LanguageCode>(['ar', 'ps']);
