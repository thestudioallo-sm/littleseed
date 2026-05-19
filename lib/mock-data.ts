/**
 * Mock data for local development when Supabase is not yet configured.
 * Import this instead of real DB calls while building UI.
 */

import type { SearchResult, SheetDetail } from './types';

export const MOCK_SHEETS: SearchResult[] = [
  {
    id:            'mock-1',
    slug:          'noah-ark-01',
    bible_story:   'Noah and the Ark',
    age_group:     'early',
    difficulty:    'easy',
    thumbnail_url: '/coloring/noah/noah-ark-01.svg',
    svg_url:       '/coloring/noah/noah-ark-01.svg',
    tags:          ['noah', 'ark', 'animals', 'flood', 'obedience'],
    title:         'Noah and the Ark',
    verse:         '"Noah was a righteous man, blameless among the people of his time, and he walked faithfully with God." — Genesis 6:9',
    rank:          1.0,
  },
  {
    id:            'mock-2',
    slug:          'david-goliath-01',
    bible_story:   'David and Goliath',
    age_group:     'elementary',
    difficulty:    'medium',
    thumbnail_url: null,
    svg_url:       '/coloring/david/david-goliath-01.svg',
    tags:          ['david', 'goliath', 'courage', 'faith', 'victory'],
    title:         'David and Goliath',
    verse:         '"I come against you in the name of the LORD." — 1 Samuel 17:45',
    rank:          0.9,
  },
  {
    id:            'mock-3',
    slug:          'jesus-loves-me-01',
    bible_story:   'Jesus Loves the Children',
    age_group:     'toddler',
    difficulty:    'very_easy',
    thumbnail_url: null,
    svg_url:       '/coloring/jesus/jesus-loves-me-01.svg',
    tags:          ['jesus', 'love', 'children', 'blessing'],
    title:         'Jesus Loves the Children',
    verse:         '"Let the little children come to me." — Matthew 19:14',
    rank:          0.85,
  },
  {
    id:            'mock-4',
    slug:          'easter-resurrection-01',
    bible_story:   'The Resurrection',
    age_group:     'early',
    difficulty:    'easy',
    thumbnail_url: null,
    svg_url:       '/coloring/easter/easter-resurrection-01.svg',
    tags:          ['easter', 'resurrection', 'empty tomb', 'hope'],
    title:         'The Resurrection',
    verse:         '"He is not here; he has risen!" — Luke 24:6',
    rank:          0.8,
  },
  {
    id:            'mock-5',
    slug:          'jonah-whale-01',
    bible_story:   'Jonah and the Whale',
    age_group:     'preschool',
    difficulty:    'very_easy',
    thumbnail_url: null,
    svg_url:       '/coloring/jonah/jonah-whale-01.svg',
    tags:          ['jonah', 'whale', 'fish', 'obedience', 'prayer'],
    title:         'Jonah and the Big Fish',
    verse:         '"The LORD provided a huge fish to swallow Jonah." — Jonah 1:17',
    rank:          0.75,
  },
  {
    id:            'mock-6',
    slug:          'good-samaritan-01',
    bible_story:   'The Good Samaritan',
    age_group:     'elementary',
    difficulty:    'medium',
    thumbnail_url: null,
    svg_url:       '/coloring/parables/good-samaritan-01.svg',
    tags:          ['samaritan', 'kindness', 'love', 'neighbor', 'parable'],
    title:         'The Good Samaritan',
    verse:         '"Which of these three was a neighbor?" — Luke 10:36',
    rank:          0.7,
  },
];

export const MOCK_POPULAR_SEARCHES = [
  'Noah', 'Easter', 'Jesus', 'David', 'Love', 'Jonah', 'Forgiveness', 'Christmas',
];

export const MOCK_DETAIL: SheetDetail = {
  ...MOCK_SHEETS[0],
  id:            'mock-1',
  bible_book:    'Genesis',
  bible_chapter: 6,
  bible_verse:   '6:9-22',
  pdf_url:       '/coloring/noah/noah-ark-01.pdf',
  is_published:  true,
  created_at:    new Date().toISOString(),
  translation: {
    id:               'tr-mock-1',
    coloring_page_id: 'mock-1',
    language_code:    'en',
    title:            'Noah and the Ark',
    verse:            '"Noah was a righteous man, blameless among the people of his time, and he walked faithfully with God." — Genesis 6:9',
    description:      'Noah trusted God and built the ark just as God commanded. Color the animals going two by two!',
    keywords:         ['noah', 'ark', 'flood', 'obedience', 'animals', 'rainbow'],
  },
  all_translations: [
    { language_code: 'en', title: 'Noah and the Ark' },
    { language_code: 'ko', title: '노아의 방주' },
    { language_code: 'es', title: 'Noé y el Arca' },
  ],
};
