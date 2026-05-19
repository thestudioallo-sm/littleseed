# LittleSeed — Deployment Guide

## Stack
- **Frontend**: Next.js 14 (App Router) → Vercel
- **Database + Auth**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (SVG, PDF, WebP thumbnails)
- **CDN**: Vercel Edge Network (automatic)

---

## 1. Supabase Setup

### 1a. Create a project
1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a region closest to your primary user base  
   (e.g. `ap-southeast-1` for Asia, `us-east-1` for Americas)
3. Copy the **Project URL** and **anon key** from  
   Settings → API

### 1b. Run the schema
1. In Supabase dashboard → SQL Editor → New query
2. Paste the full contents of `supabase/schema.sql`
3. Run — this creates all tables, indexes, RLS policies, and seed data

### 1c. Create Storage buckets
In Storage → New bucket:

| Bucket name | Public | Purpose |
|---|---|---|
| `coloring`  | ✅ Yes | SVG, PDF, WebP assets |

Then set bucket policy:
```sql
-- Allow public read on coloring bucket
CREATE POLICY "Public read coloring"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'coloring');
```

### 1d. Upload example assets
Upload `public/coloring/noah/noah-ark-01.svg` to:  
`Storage → coloring → noah/noah-ark-01.svg`

The public URL will be:  
`https://<project>.supabase.co/storage/v1/object/public/coloring/noah/noah-ark-01.svg`

---

## 2. Environment Variables

Create `.env.local` (never commit this):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # server-only
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_ASSET_BASE_URL=https://your-project.supabase.co/storage/v1/object/public/coloring
```

---

## 3. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example .env.local
# → fill in your Supabase values

# 3. Run dev server
npm run dev
# → open http://localhost:3000
```

### Dev without Supabase
For pure UI development, swap the data calls in `app/page.tsx` and  
`app/search/page.tsx` to use `MOCK_SHEETS` from `lib/mock-data.ts`:

```ts
// Temporarily replace in app/page.tsx:
import { MOCK_SHEETS, MOCK_POPULAR_SEARCHES } from '@/lib/mock-data';
const sheets   = MOCK_SHEETS.slice(0, 8);
const keywords = MOCK_POPULAR_SEARCHES;
```

---

## 4. Vercel Deployment

### 4a. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-org/littleseed.git
git push -u origin main
```

### 4b. Import on Vercel
1. vercel.com → New Project → Import from GitHub
2. Framework preset: **Next.js** (auto-detected)
3. Add environment variables (copy from `.env.local`)
4. Deploy

### 4c. Custom domain
In Vercel → Domains → Add your domain.  
Update `NEXT_PUBLIC_BASE_URL` env var to the live URL.

---

## 5. Performance Checklist

Run after every deploy:

- [ ] [PageSpeed Insights](https://pagespeed.web.dev) mobile score > 90
- [ ] First Contentful Paint < 1.5s on Fast 3G simulation
- [ ] Total Blocking Time < 200ms
- [ ] LCP image has `loading="eager"` + `fetchpriority="high"` on detail page
- [ ] All coloring SVGs < 100KB (optimise with [SVGO](https://svgo.dev))
- [ ] PDF files < 300KB per sheet
- [ ] WebP thumbnails generated and uploaded to Supabase Storage
- [ ] `manifest.json` reachable at `/manifest.json`
- [ ] Service worker registers (check DevTools → Application)
- [ ] Offline page renders when network is off

---

## 6. Adding a New Coloring Sheet

### Step 1 — Prepare files
```
public/coloring/<story>/
  <story>-01.svg    ← optimised with SVGO, < 100KB
  <story>-01.pdf    ← exported from SVG, < 300KB
  <story>-01.webp   ← thumbnail 400×533, < 30KB
```

Optimise SVG:
```bash
npx svgo --config svgo.config.js public/coloring/story/story-01.svg
```

### Step 2 — Upload to Supabase Storage
Upload all three files to the `coloring` bucket under the same path.

### Step 3 — Insert into database
```sql
INSERT INTO coloring_pages
  (slug, bible_story, bible_book, bible_chapter, bible_verse,
   age_group, difficulty, svg_url, pdf_url, thumbnail_url, tags)
VALUES (
  'story-slug-01', 'Story Name', 'Book', chapter, 'verse-ref',
  'early', 'easy',
  '/coloring/story/story-01.svg',
  '/coloring/story/story-01.pdf',
  '/coloring/story/story-01.webp',
  ARRAY['tag1','tag2','tag3']
);

-- Add at minimum an English translation
INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'en', 'Title', 'Verse text — Reference', 'Teacher note.', ARRAY['keyword']
FROM coloring_pages WHERE slug = 'story-slug-01';
```

---

## 7. SEO Configuration

- Dynamic `<title>` and `<meta description>` set per page via `generateMetadata()`
- Canonical URL in root `layout.tsx`
- OpenGraph tags on detail pages
- Add `app/sitemap.ts` when content grows:

```ts
// app/sitemap.ts
import { supabase } from '@/lib/supabase';
export default async function sitemap() {
  const { data } = await supabase.from('coloring_pages').select('slug, updated_at');
  return (data ?? []).map((p) => ({
    url:          `https://littleseed.app/sheet/${p.slug}`,
    lastModified: p.updated_at,
    priority:     0.8,
  }));
}
```

---

## 8. Bandwidth Optimisation for Developing Countries

| Technique | How |
|---|---|
| SVG first | Use SVG directly — no raster image decode |
| WebP thumbnails | 80% smaller than PNG at same quality |
| Server components | No client JS hydration for browse/search pages |
| `revalidate = 3600` | Static ISR caching — CDN serves most traffic |
| No custom fonts | System fonts load instantly |
| Lean bundle | Zero animation/carousel libraries |
| PWA offline | Users cache sheets for offline printing |
| API edge cache | `s-maxage=60` on search API — CDN deduplication |

---

## 9. Supabase Free Tier Limits

| Resource | Free limit | Notes |
|---|---|---|
| Database | 500MB | Sufficient for thousands of sheets + translations |
| Storage | 1GB | ~3,000 SVG+PDF+WebP sets |
| Bandwidth | 5GB/month | Enable CDN caching to stay within limit |
| API requests | Unlimited | Rate-limited by Supabase, not counted |

Upgrade to Pro ($25/mo) when approaching limits.

---

## 10. Troubleshooting

**Search returns nothing**  
→ Check RLS policies are enabled and anon role can SELECT  
→ Verify `is_published = TRUE` on your rows  
→ Re-run `schema.sql` if search function is missing  

**SVG not rendering in browser**  
→ Ensure `Content-Type: image/svg+xml` header from Supabase Storage  
→ In bucket settings, check MIME type override  

**PWA not installing**  
→ Must be served over HTTPS  
→ `manifest.json` must have at least one 192px icon  
→ Service worker scope must include the page path  

**Slow load on 2G**  
→ Run SVGO on all SVGs  
→ Check thumbnail sizes with `npm run build` → Vercel bundle analysis  
→ Confirm no client-side data fetching on homepage (use server components)  
