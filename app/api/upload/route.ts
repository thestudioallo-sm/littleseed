import { NextRequest, NextResponse } from 'next/server';
import { toSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
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

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL        ?? '';
  const anon         = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY   ?? '';
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY       ?? '';
  const urlOk        = !!supabaseUrl && !supabaseUrl.includes('placeholder');
  const anonOk       = !!anon        && !anon.includes('placeholder');
  const serviceOk    = !!serviceKey  && !serviceKey.includes('placeholder');
  const isMock       = !(urlOk && anonOk && serviceOk);

  if (isMock) {
    return NextResponse.json({
      ok: true, mocked: true, slug,
      reason: {
        url_present: !!supabaseUrl, url_is_real: urlOk,
        url_host: urlOk ? new URL(supabaseUrl).host : (supabaseUrl || '(empty)'),
        anon_present: !!anon, anon_is_real: anonOk,
        service_present: !!serviceKey, service_is_real: serviceOk,
      },
      hint:
        !urlOk     ? 'NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder on the server.' :
        !anonOk    ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or placeholder.' :
        !serviceOk ? 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' :
                     'Supabase config looks ok but something else blocked the upload.',
      title, reference, verse, description, tags,
      age_group: ageGroup, difficulty, svg_bytes: svgText.length,
    });
  }

  const { getSupabaseAdmin } = await import('@/lib/supabase');
  const supa = getSupabaseAdmin();

  // ── Auto-heal: make sure the "coloring" bucket exists (public) ──
  // This is idempotent — listBuckets + createBucket only fire when missing.
  try {
    const { data: buckets, error: listErr } = await supa.storage.listBuckets();
    if (listErr) {
      return NextResponse.json({
        error: 'Could not list storage buckets',
        detail: listErr.message,
        hint: 'Check that the SUPABASE_SERVICE_ROLE_KEY env var is correct on the server.',
      }, { status: 500 });
    }
    const exists = (buckets ?? []).some((b) => b.name === 'coloring');
    if (!exists) {
      const { error: createErr } = await supa.storage.createBucket('coloring', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
      });
      if (createErr) {
        return NextResponse.json({
          error: 'Could not auto-create "coloring" bucket',
          detail: createErr.message,
          hint:
            'Open Supabase dashboard → Storage → New bucket → name "coloring" (public).',
        }, { status: 500 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({
      error: 'Storage init failed',
      detail: e?.message ?? String(e),
    }, { status: 500 });
  }

  const path = `user-uploads/${slug}.svg`;
  const { error: upErr } = await supa
    .storage.from('coloring')
    .upload(path, svgText, { contentType: 'image/svg+xml', upsert: false });
  if (upErr) {
    return NextResponse.json({
      error: 'Storage upload failed',
      detail: upErr.message,
      hint: 'Bucket exists but upload was rejected. Check service_role key + bucket policies.',
    }, { status: 500 });
  }

  const publicUrl = supa.storage.from('coloring').getPublicUrl(path).data.publicUrl;

  const insertPayload = {
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
  };

  const { data: page, error: pageErr } = await supa
    .from('coloring_pages')
    .insert(insertPayload)
    .select('id, slug')
    .single();

  if (pageErr || !page) {
    return NextResponse.json({
      error:  'DB insert failed',
      detail: pageErr?.message ?? 'unknown',
      code:   (pageErr as any)?.code ?? null,
      hint:   (pageErr as any)?.hint ?? null,
      payload_sent: {
        slug,
        bible_story:  title,
        bible_book:   insertPayload.bible_book,
        bible_verse:  insertPayload.bible_verse,
        age_group:    ageGroup,
        difficulty,
        tags_count:   tags.length,
        is_published: true,
      },
    }, { status: 500 });
  }

  const { error: trErr } = await supa.from('translations').insert({
    coloring_page_id: page.id,
    language_code:    'en',
    title,
    verse:            verse || '',
    description:      description || null,
    keywords:         tags,
  });

  if (trErr) {
    return NextResponse.json({
      ok: true, slug: page.slug,
      warning: 'Sheet saved but English translation row failed to insert.',
      detail:  trErr.message,
    });
  }

  return NextResponse.json({ ok: true, slug: page.slug });
}
