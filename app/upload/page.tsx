'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { convertFileToSvg, svgSizeKb, type ConvertMode, type ConvertResult } from '@/lib/imageToSvg';
import { AGE_GROUP_LABELS, DIFFICULTY_LABELS, type AgeGroup, type Difficulty } from '@/lib/types';

const ACCEPT = 'image/png,image/jpeg,image/svg+xml,application/pdf';
const MAX_BYTES = 12 * 1024 * 1024;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [reference, setReference] = useState('');
  const [verse, setVerse] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('early');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<ConvertMode>('outline');
  const [threshold, setThreshold] = useState(128);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [published, setPublished] = useState<{ slug: string; mocked: boolean } | null>(null);
  const dropRef = useRef<HTMLLabelElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    function over(e: DragEvent) { e.preventDefault(); setDragging(true); }
    function leave() { setDragging(false); }
    function drop(e: DragEvent) {
      e.preventDefault(); setDragging(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) acceptFile(f);
    }
    el.addEventListener('dragover', over);
    el.addEventListener('dragleave', leave);
    el.addEventListener('drop', drop);
    return () => {
      el.removeEventListener('dragover', over);
      el.removeEventListener('dragleave', leave);
      el.removeEventListener('drop', drop);
    };
  }, []);

  function acceptFile(f: File) {
    setError(null); setResult(null); setPublished(null);
    if (f.size > MAX_BYTES) { setError('File is too large (max 12 MB).'); return; }
    const ok = f.type === 'image/png' || f.type === 'image/jpeg' || f.type === 'image/svg+xml' || f.type === 'application/pdf' || /\.(png|jpe?g|svg|pdf)$/i.test(f.name);
    if (!ok) { setError('Unsupported type. Use PNG, JPG, SVG, or PDF.'); return; }
    setFile(f);
    if (!title) {
      const base = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      setTitle(base.replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }

  async function handleConvert() {
    if (!file) { setError('Choose a file first.'); return; }
    if (!title.trim()) { setError('Add a title.'); return; }
    setBusy(true); setError(null); setResult(null); setPublished(null);
    try {
      const out = await convertFileToSvg(file, { mode, threshold, title, reference, verse, description });
      setResult(out);
    } catch (err: any) {
      setError(err?.message ?? 'Conversion failed.');
    } finally { setBusy(false); }
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title.trim() || 'sheet').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.svg';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function handlePublish() {
    if (!result) return;
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.set('file', new Blob([result.svg], { type: 'image/svg+xml' }), 'sheet.svg');
      fd.set('title', title);
      fd.set('reference', reference);
      fd.set('verse', verse);
      fd.set('description', description);
      fd.set('tags', tags);
      fd.set('age_group', ageGroup);
      fd.set('difficulty', difficulty);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        const parts = [data?.error ?? 'Publish failed'];
        if (data?.detail)       parts.push(`detail: ${data.detail}`);
        if (data?.code)         parts.push(`code: ${data.code}`);
        if (data?.hint)         parts.push(`hint: ${data.hint}`);
        if (data?.payload_sent) parts.push(`payload: ${JSON.stringify(data.payload_sent)}`);
        throw new Error(parts.join('\n'));
      }
      setPublished({ slug: data.slug, mocked: Boolean(data.mocked) });
      if (data.mocked && data.hint) setError(`⚠ ${data.hint}`);
      if (data.warning)             setError(`⚠ ${data.warning}${data.detail ? ' — ' + data.detail : ''}`);
    } catch (err: any) {
      setError(err?.message ?? 'Publish failed.');
    } finally { setBusy(false); }
  }

  const previewSrc = useMemo(() => {
    if (!result) return '';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(result.svg);
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4" style={{ minHeight: 40 }}>
        ← Home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Upload &amp; Convert</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Drop a JPG, PNG, SVG, or PDF — we&rsquo;ll extract the line art and produce a printable coloring sheet with your title and Bible verse.
      </p>

      <div className="grid md:grid-cols-[1fr_360px] gap-6">
        <div>
          <label ref={dropRef} htmlFor="upload-file"
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            style={{ minHeight: 180 }}>
            <input id="upload-file" type="file" accept={ACCEPT} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />
            <div className="text-4xl mb-2" aria-hidden="true">📤</div>
            {file ? (
              <>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}</p>
                <p className="text-xs text-blue-600 mt-2 underline">Choose another file</p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-700">Drag &amp; drop or click to choose</p>
                <p className="text-xs text-gray-500 mt-1">PNG · JPG · SVG · PDF (max 12 MB)</p>
              </>
            )}
          </label>

          <div className="mt-5 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center" style={{ aspectRatio: '595 / 842' }}>
            {result ? (
              <object data={previewSrc} type="image/svg+xml" className="w-full h-full" aria-label="Converted coloring sheet preview" />
            ) : (
              <p className="text-sm text-gray-400">{busy ? 'Converting…' : 'Preview will appear here after conversion.'}</p>
            )}
          </div>

          {result && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>📦 {svgSizeKb(result.svg)}</span>
              <span>🖋️ {result.runCount.toLocaleString()} line runs</span>
              <span>📄 A4 · {result.width}×{result.height} pt</span>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Post details</legend>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Title *</span>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Noah and the Ark" maxLength={120}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" style={{ minHeight: 44 }} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Bible reference</span>
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Genesis 6:9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" style={{ minHeight: 44 }} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Verse text</span>
              <textarea value={verse} onChange={(e) => setVerse(e.target.value)} placeholder='"Noah was a righteous man..."' rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-y" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Description / activity note</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Color the animals going two by two!" rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-y" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</span>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="noah, ark, animals"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" style={{ minHeight: 44 }} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-xs text-gray-500 mb-1">Age</span>
                <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" style={{ minHeight: 40 }}>
                  {Object.entries(AGE_GROUP_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs text-gray-500 mb-1">Difficulty</span>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none" style={{ minHeight: 40 }}>
                  {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 border-t border-gray-100 pt-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Line extraction</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {(['outline', 'bw', 'grayscale'] as ConvertMode[]).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`px-2 py-1.5 text-xs font-medium rounded border ${mode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  style={{ minHeight: 40 }}>
                  {m === 'outline' ? 'Lines' : m === 'bw' ? 'B&W' : 'Grey'}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="block text-xs text-gray-500 mb-1">Sensitivity: {threshold}</span>
              <input type="range" min={60} max={200} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" />
            </label>
          </fieldset>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}
          {published && (
            <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
              ✓ {published.mocked ? 'Saved locally. Slug: ' : 'Published. View at '}
              {published.mocked
                ? <code className="text-xs">{published.slug}</code>
                : <Link className="underline font-medium" href={`/sheet/${published.slug}`}>/sheet/{published.slug}</Link>}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={handleConvert} disabled={!file || busy}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: 52 }}>
              {busy ? 'Working…' : '🎨 Convert to SVG'}
            </button>
            <button type="button" onClick={handleDownload} disabled={!result}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: 48 }}>
              ⬇ Download SVG
            </button>
            <button type="button" onClick={handlePublish} disabled={!result || busy}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-green-600 text-green-700 font-semibold text-sm hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: 48 }}>
              🌐 Publish to gallery
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
