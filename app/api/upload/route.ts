import { NextRequest, NextResponse } from 'next/server';
import { toSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/upload
 *
 * Accepts a multipart payload containing:
 *   - file       : the produced SVG (Blob) — generated client-side
 *   - title      : sheet title
 *   - reference  : "Genesis 6:9" or similar
 *   - verse      : full verse text
 *   - description: teacher / activity note
 *   - tags       : comma-separated keywords
 *
 * Validates inputs, generates a slug, and (when Supabase is properly
 * configured) inserts a `coloring_pages` row plus a single English
 * translation. In mock mode (placeholder Supabase URL) it returns the
 * accepted payload so the UI can confirm a successful conversion
 * without hitting the database.
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const file        = form.get('file');
  const title       = (form.get('title')       ?? '').toString().trim();
  const reference   = (form.get('reference')   ?? '').toString().trim();
  const verse       = (form.get('verse')       ?? '').toString().trim();
  const description = (form.get('description') ?? '').toString().trim();
  const tagsRaw     = (form.get('tags')        ?? '').toString().trim();
  const ageGroup    = (form.get('age_group')   ?? 'early').toString();
  const difficulty  = (form.get('difficulty')  ?? 'easy').toString();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (title.length > 120) {
    return NextResponse.json({ error: 'Title is too long (max 120 chars)' }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing SVG file' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'SVG too large (max 5 MB)' }, { status: 413 });
  }

  // Validate the file really is an SVG to prevent abuse
  const svgText = await file.text();
  if (!svgText.includes('<svg')) {
    return NextResponse.json({ error: 'Payload is not a valid SVG' }, { status: 400 });
  }

  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 16);

  const slug = `${toSlug(title)}-${Date.now().toString(36).slice(-5)}`;

  const isMock =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isMock) {
    // No persistence path — the client already has the SVG locally.
    return NextResponse.json({
      ok:           true,
      mocked:       true,
      slug,
      title,
      reference,
      verse,
      description,
      tags,
      age_group:    ageGroup,
      difficulty,
      svg_bytes:    svgText.length,
    });
  }

  // ── Real Supabase path ─────────────────────────────────────────
  // Lazy-import so build-time bundling does not pull the SDK if the
  // env vars are missing.
  const { getSupabaseAdmin } = await import('@/lib/supabase');
  const supa = getSupabaseAdmin();

  // 1. Upload the SVG to the `coloring` bucket
  const path = `user-uploads/${slug}.svg`;
  const { error: upErr } = await supa
    .storage
    .from('coloring')
    .upload(path, svgText, { contentType: 'image/svg+xml', upsert: false });
  if (upErr) {
    return NextResponse.json({ error: 'Storage upload failed', detail: upErr.message }, { status: 500 });
  }

  const publicUrl = supa.storage.from('coloring').getPublicUrl(path).data.publicUrl;

  // 2. Insert coloring_pages row
  const { data: page, error: pageErr } = await supa
    .from('coloring_pages')
    .insert({
      slug,
      bible_story:   title,
      bible_book:    reference ? reference.split(/\s+\d/)[0] : null,
      bible_verse:   reference || null,
      age_group:     ageGroup,
      difficulty,
      svg_url:       publicUrl,
      thumbnail_url: publicUrl,
      tags,
      is_published:  true,
    })
    .select('id, slug')
    .single();

  if (pageErr || !page) {
    return NextResponse.json({ error: 'DB insert failed', detail: pageErr?.message }, { status: 500 });
  }

  // 3. Insert default English translation
  await supa.from('translations').insert({
    coloring_page_id: page.id,
    language_code:    'en',
    title,
    verse:            verse || '',
    description:      description || null,
    keywords:         tags,
  });

  return NextResponse.json({ ok: true, slug: page.slug });
}
