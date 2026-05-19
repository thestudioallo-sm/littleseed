# LittleSeed 🌱

**Free Bible coloring sheets for children, missionaries, and Sunday school teachers.**

Lightweight · Printable · Multi-language · PWA-ready

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# → fill in your Supabase URL and anon key

# 3. Run database schema
# Open Supabase → SQL Editor → paste supabase/schema.sql → Run

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

To develop without Supabase, temporarily swap the data calls in
`app/page.tsx` and `app/search/page.tsx` to use `MOCK_SHEETS` from
`lib/mock-data.ts` (see comments in those files).

---

## Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete guide:
Vercel setup, Supabase storage, env vars, and the performance checklist.

---

## Project structure

See **[STRUCTURE.md](./STRUCTURE.md)** for a full annotated file tree.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server components = zero hydration on browse pages |
| Database | Supabase / PostgreSQL | Full-text search built in; free tier generous |
| Styling | Tailwind CSS (minimal) | No runtime CSS-in-JS; purged at build |
| Assets | SVG + WebP + PDF | Tiny files, resolution-independent, printable |
| PWA | next-pwa | Offline caching of visited sheets |
| Fonts | System fonts only | Zero font download latency |

---

## Performance targets

| Metric | Target |
|---|---|
| Lighthouse mobile | > 90 |
| First load (slow 3G) | < 2 s |
| SVG file size | < 100 KB |
| PDF file size | < 300 KB |
| WebP thumbnail | < 30 KB |

---

## License

All coloring sheets are released to the public domain (CC0).
Use freely for ministry, print, and distribution.
