# LittleSeed — Full Folder Structure

Every file listed with its one-line purpose.

```
littleseed/
│
├── app/                                  Next.js App Router root
│   ├── globals.css                       Base CSS reset + print styles
│   ├── layout.tsx                        Root HTML shell, metadata, Header
│   ├── page.tsx                          Homepage — search bar + recent sheets
│   ├── loading.tsx                       Global suspense loading spinner
│   ├── error.tsx                         Global error boundary (client)
│   ├── not-found.tsx                     Global 404 page
│   ├── robots.ts                         /robots.txt — Next.js metadata API
│   ├── sitemap.ts                        /sitemap.xml — dynamic, all sheets
│   │
│   ├── about/
│   │   └── page.tsx                      About / mission / how-to-use page
│   │
│   ├── search/
│   │   └── page.tsx                      Search results page (server component)
│   │
│   ├── sheet/
│   │   └── [slug]/
│   │       ├── page.tsx                  Sheet detail — SVG, verse, download
│   │       └── not-found.tsx             404 for unknown sheet slugs
│   │
│   └── api/
│       ├── search/
│       │   └── route.ts                  GET /api/search — full-text search JSON
│       └── sheets/
│           └── [slug]/
│               └── route.ts              GET /api/sheets/:slug — sheet JSON API
│
├── components/                           Shared UI components
│   ├── Header.tsx                        Sticky top nav (logo + Browse + About)
│   ├── SearchBar.tsx                     Controlled search input + submit (client)
│   ├── SheetCard.tsx                     Grid card — thumbnail, title, meta chips
│   ├── FilterBar.tsx                     Age / difficulty dropdowns (client)
│   ├── LanguageSelector.tsx              Lang <select> — updates ?lang= param
│   └── PrintButton.tsx                   window.print() trigger (client)
│
├── lib/                                  Data layer + shared logic
│   ├── supabase.ts                       Supabase browser client + admin client
│   ├── types.ts                          All TypeScript types & enums
│   ├── search.ts                         searchSheets(), getSheetBySlug(), etc.
│   ├── utils.ts                          toSlug, assetUrl, cx, truncate, etc.
│   ├── mock-data.ts                      Static mock sheets for local dev
│   └── i18n/
│       └── dictionaries.ts              UI string translations (en/ko/es/fr/pt)
│
├── public/                               Static files served as-is
│   ├── manifest.json                     PWA web app manifest
│   ├── sw-custom.js                      Custom service worker additions
│   ├── offline.html                      Offline fallback page (no JS)
│   └── coloring/                         All coloring sheet assets
│       ├── noah/
│       │   ├── noah-ark-01.svg           Noah coloring sheet (SVG, printable)
│       │   ├── noah-ark-01.pdf           Noah coloring sheet (PDF, printable)
│       │   └── noah-ark-01.webp          Noah thumbnail (400×533, WebP)
│       ├── jesus/
│       │   ├── jesus-loves-me-01.svg     Jesus loves children (toddler)
│       │   ├── jesus-loves-me-01.pdf
│       │   └── jesus-loves-me-01.webp
│       ├── david/
│       │   ├── david-goliath-01.svg      David & Goliath (elementary)
│       │   ├── david-goliath-01.pdf
│       │   └── david-goliath-01.webp
│       ├── easter/
│       │   ├── easter-resurrection-01.svg
│       │   ├── easter-resurrection-01.pdf
│       │   └── easter-resurrection-01.webp
│       ├── jonah/
│       │   ├── jonah-whale-01.svg
│       │   ├── jonah-whale-01.pdf
│       │   └── jonah-whale-01.webp
│       └── parables/
│           ├── good-samaritan-01.svg
│           ├── good-samaritan-01.pdf
│           └── good-samaritan-01.webp
│
├── supabase/
│   └── schema.sql                        Full DB schema, RLS, seed data, FTS func
│
├── .env.example                          Environment variable template
├── next.config.js                        Next.js + next-pwa configuration
├── tailwind.config.ts                    Minimal Tailwind theme tokens
├── postcss.config.js                     PostCSS plugins
├── tsconfig.json                         TypeScript configuration
├── package.json                          Dependencies & scripts
├── svgo.config.js                        SVG optimisation settings
├── DEPLOYMENT.md                         Full deploy guide (Vercel + Supabase)
└── STRUCTURE.md                          This file
```

---

## Key Design Decisions

### Server vs Client components

| Component | Type | Why |
|---|---|---|
| `app/page.tsx` | Server | Fetches recent sheets + keywords at build/ISR time |
| `app/search/page.tsx` | Server | FTS query runs server-side; no hydration |
| `app/sheet/[slug]/page.tsx` | Server | SVG/PDF links + verse text static |
| `SearchBar.tsx` | Client | Needs `onChange`, `useRouter` for navigation |
| `FilterBar.tsx` | Client | Needs `onChange` for filter updates |
| `LanguageSelector.tsx` | Client | Needs `onChange` to swap `?lang=` param |
| `PrintButton.tsx` | Client | Needs `window.print()` |

### Data flow

```
User types query
  → SearchBar (client) pushes /search?q=Noah
    → app/search/page.tsx (server) calls searchSheets()
      → lib/search.ts calls Supabase RPC search_coloring_pages()
        → PostgreSQL FTS with ts_rank boosting
          → Results rendered as SheetCard grid (no hydration)
```

### Asset URL strategy

- **Development**: SVG/PDF served from `/public/coloring/` directly
- **Production**: Upload to Supabase Storage `coloring` bucket
  - Set `NEXT_PUBLIC_ASSET_BASE_URL` env var
  - `lib/utils.ts assetUrl()` resolves the correct prefix
- WebP thumbnails served via same CDN path

### Translation architecture

```
coloring_pages (canonical, English)
  └── translations (1 row per language per sheet)
        language_code: 'en' | 'ko' | 'es' | 'fr' | 'pt'
        title        : localised sheet title
        verse        : localised scripture text
        description  : teacher note / activity prompt
        keywords[]   : localised search terms
```

The SVG image is shared across all languages — only text changes.
`/sheet/[slug]?lang=ko` fetches the Korean translation row and
renders Korean verse text alongside the same SVG.

---

## Adding content workflow

```
1. Draw SVG  →  optimise with SVGO  →  export PDF
2. Generate WebP thumbnail (convert with ImageMagick or Squoosh)
3. Upload all three files to Supabase Storage / coloring bucket
4. INSERT into coloring_pages + translations (see DEPLOYMENT.md §6)
5. Redeploy (or let ISR revalidate on next request)
```
