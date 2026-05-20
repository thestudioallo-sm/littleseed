import type { MetadataRoute } from 'next';
import { getSupabase } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://littleseed.app';

/**
 * Dynamic sitemap — generated at build time (ISR).
 * Includes all published coloring sheets across all languages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url:              `${BASE_URL}/`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${BASE_URL}/search`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/about`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.5,
    },
    {
      url:              `${BASE_URL}/upload`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.4,
    },
  ];

  // Dynamic sheet routes
  const { data: pages, error } = await getSupabase()
    .from('coloring_pages')
    .select('slug, updated_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error || !pages) return staticRoutes;

  const sheetRoutes: MetadataRoute.Sitemap = pages.flatMap((page) => {
    // One canonical URL per sheet, plus lang variants
    const langs = ['en', 'ko', 'es', 'fr', 'pt'];
    return langs.map((lang) => ({
      url:             `${BASE_URL}/sheet/${page.slug}?lang=${lang}`,
      lastModified:    new Date(page.updated_at),
      changeFrequency: 'monthly' as const,
      priority:        lang === 'en' ? 0.8 : 0.6,
    }));
  });

  return [...staticRoutes, ...sheetRoutes];
}
