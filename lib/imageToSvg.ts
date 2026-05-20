/**
 * Image → SVG line-art converter (client-side, zero dependencies).
 *
 *   1. Loads JPG / PNG / (rasterised) PDF into a <canvas>
 *   2. Greyscale → optional Sobel edge detection → threshold
 *   3. Encodes the resulting 1-bit bitmap as horizontal run-length
 *      <path> data — far smaller than embedding the raw raster
 *   4. Wraps the line-art in an A4-style SVG with title, scripture
 *      reference, verse text and description — mirroring the public
 *      coloring-sheet layout.
 *
 * All processing happens in the browser; no upload is required to
 * produce the final SVG file.
 */

export type ConvertMode = 'outline' | 'bw' | 'grayscale';

export interface ConvertOptions {
  /** Edge-detection vs. threshold vs. greyscale */
  mode?:        ConvertMode;
  /** 0–255 threshold, default 128 */
  threshold?:   number;
  /** Hard cap on long side in pixels before tracing (default 900) */
  maxSide?:     number;
  /** Title shown at the top of the sheet */
  title:        string;
  /** Scripture reference, e.g. "Genesis 6:9"  */
  reference?:   string;
  /** Full verse text */
  verse?:       string;
  /** Teacher / activity note */
  description?: string;
  /** Footer brand line (default 'littleseed.app') */
  footer?:      string;
}

export interface ConvertResult {
  svg:          string;      // self-contained SVG markup
  width:        number;      // intrinsic px width of traced art
  height:       number;
  byteSize:     number;      // size of the produced SVG in bytes
  runCount:     number;      // number of horizontal run-paths emitted
}

// ── A4 portrait in pt (72dpi) — matches the existing sheets ─────────
const PAGE_W   = 595;
const PAGE_H   = 842;

const MARGIN_X = 40;
const HEADER_H = 130;   // title + reference + divider
const FOOTER_H = 90;    // verse + brand
const ART_TOP  = HEADER_H;
const ART_BOT  = PAGE_H - FOOTER_H;

// ── Helpers ────────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Wrap a string to a max-width by character count (very simple) */
function wrap(text: string, max: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur ? cur + ' ' : '') + w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Load any image-like Blob into an HTMLImageElement */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Cannot decode image'));
    img.src = src;
  });
}

/** Greyscale in place (Rec. 601 luminance) */
function toGreyscale(d: Uint8ClampedArray) {
  for (let i = 0; i < d.length; i += 4) {
    const l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = l;
  }
}

/** Sobel edge detection — returns a Uint8Array where 1 = edge, 0 = bg */
function sobel(grey: Uint8ClampedArray, w: number, h: number, edgeThreshold: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const at = (x: number, y: number) =>
    (x < 0 || y < 0 || x >= w || y >= h) ? 255 : grey[(y * w + x) * 4];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -at(x - 1, y - 1) + at(x + 1, y - 1) +
        -2 * at(x - 1, y) + 2 * at(x + 1, y) +
        -at(x - 1, y + 1) + at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      const mag = Math.sqrt(gx * gx + gy * gy);
      out[y * w + x] = mag > edgeThreshold ? 1 : 0;
    }
  }
  return out;
}

/** Convert grey buffer → 1-bit mask (1 = ink) via threshold */
function thresholdMask(grey: Uint8ClampedArray, w: number, h: number, t: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < grey.length; i += 4, j++) {
    out[j] = grey[i] < t ? 1 : 0;
  }
  return out;
}

/**
 * Trace a 1-bit mask into a single <path> "d" attribute using
 * horizontal run-length packing (M x y h len).
 * Drastically smaller than embedding a raster while preserving the
 * exact pixel shape.
 */
function maskToPath(mask: Uint8Array, w: number, h: number, scaleX: number, scaleY: number, offsetX: number, offsetY: number) {
  let d = '';
  let runs = 0;
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (mask[y * w + x]) {
        let runStart = x;
        while (x < w && mask[y * w + x]) x++;
        const runEnd = x;                   // exclusive
        const px = (runStart * scaleX + offsetX).toFixed(2);
        const py = (y * scaleY + offsetY).toFixed(2);
        const len = ((runEnd - runStart) * scaleX).toFixed(2);
        d += `M${px} ${py}h${len}`;
        runs++;
      } else {
        x++;
      }
    }
  }
  return { d, runs };
}

/**
 * Main conversion entry point. Reads pixels from a <canvas> already
 * sized to the source image, traces, and returns the assembled SVG.
 */
export function traceCanvasToSvg(
  ctx:    CanvasRenderingContext2D,
  width:  number,
  height: number,
  opts:   ConvertOptions
): ConvertResult {
  const mode       = opts.mode      ?? 'outline';
  const threshold  = opts.threshold ?? 128;

  // ── 1. Grab + greyscale ─────────────────────────────────────────
  const id = ctx.getImageData(0, 0, width, height);
  toGreyscale(id.data);

  // ── 2. Build 1-bit mask ─────────────────────────────────────────
  let mask: Uint8Array;
  if (mode === 'outline') {
    mask = sobel(id.data, width, height, threshold * 0.6);
  } else {
    mask = thresholdMask(id.data, width, height, threshold);
  }

  // ── 3. Fit the art into the page (preserve aspect) ──────────────
  const artW = PAGE_W - MARGIN_X * 2;
  const artH = ART_BOT - ART_TOP;
  const scale = Math.min(artW / width, artH / height);
  const drawnW = width  * scale;
  const drawnH = height * scale;
  const offsetX = (PAGE_W - drawnW) / 2;
  const offsetY = ART_TOP + (artH - drawnH) / 2;

  const { d, runs } = maskToPath(mask, width, height, scale, scale, offsetX, offsetY);

  // ── 4. Compose final SVG with title / verse / description ───────
  const titleSafe = xmlEscape(opts.title.trim() || 'Untitled');
  const refSafe   = xmlEscape((opts.reference ?? '').trim());
  const verseSafe = xmlEscape((opts.verse     ?? '').trim());
  const descLines = wrap((opts.description ?? '').trim(), 86).slice(0, 3);
  const footer    = xmlEscape(opts.footer ?? 'littleseed.app');

  // Verse below the art — wrap onto multiple lines so long verses fit
  const verseLines = wrap(verseSafe, 90).slice(0, 3);

  const verseTspans = verseLines
    .map((l, i) => `<tspan x="${PAGE_W / 2}" dy="${i === 0 ? 0 : 14}">${l}</tspan>`)
    .join('');

  const descTspans = descLines
    .map((l, i) => `<tspan x="${PAGE_W / 2}" dy="${i === 0 ? 0 : 12}">${l}</tspan>`)
    .join('');

  const svg =
`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_W} ${PAGE_H}" width="${PAGE_W}" height="${PAGE_H}" preserveAspectRatio="xMidYMid meet">
<title>${titleSafe}</title>
<rect width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>
<g font-family="Georgia, 'Times New Roman', serif" fill="#111111">
<text x="${PAGE_W / 2}" y="52" font-size="22" font-weight="700" text-anchor="middle">${titleSafe}</text>
${refSafe ? `<text x="${PAGE_W / 2}" y="76" font-size="12" fill="#555555" text-anchor="middle">${refSafe}</text>` : ''}
${descTspans ? `<text y="98" font-size="10" fill="#666666" text-anchor="middle">${descTspans}</text>` : ''}
</g>
<line x1="${MARGIN_X}" y1="${HEADER_H - 15}" x2="${PAGE_W - MARGIN_X}" y2="${HEADER_H - 15}" stroke="#dddddd" stroke-width="1"/>
<path d="${d}" fill="#111111" fill-rule="nonzero" shape-rendering="crispEdges"/>
<line x1="${MARGIN_X}" y1="${ART_BOT + 10}" x2="${PAGE_W - MARGIN_X}" y2="${ART_BOT + 10}" stroke="#dddddd" stroke-width="1"/>
${verseTspans ? `<text y="${ART_BOT + 32}" font-family="Georgia, 'Times New Roman', serif" font-size="11" font-style="italic" fill="#444444" text-anchor="middle">${verseTspans}</text>` : ''}
<text x="${PAGE_W / 2}" y="${PAGE_H - 18}" font-family="-apple-system, system-ui, sans-serif" font-size="8" fill="#bbbbbb" text-anchor="middle">${footer} — Free Bible Coloring Sheet</text>
</svg>`;

  return {
    svg,
    width:    PAGE_W,
    height:   PAGE_H,
    byteSize: new Blob([svg]).size,
    runCount: runs,
  };
}

/**
 * Convenience: take a File (PNG / JPG / SVG / PDF page) and produce
 * a finished SVG. PDFs need pdfjs-dist; if not loaded we fall back to
 * an embedded `<image>` reference so the user still gets a usable SVG.
 */
export async function convertFileToSvg(file: File, opts: ConvertOptions, maxSide = 900): Promise<ConvertResult> {
  // SVG passthrough — just inject metadata wrapper around the source
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    const text = await file.text();
    // Strip XML declaration; embed inside a wrapper
    const inner = text.replace(/<\?xml[^?]*\?>/i, '').trim();
    const titleSafe = xmlEscape(opts.title || 'Untitled');
    const refSafe   = xmlEscape(opts.reference ?? '');
    const verseSafe = xmlEscape(opts.verse ?? '');
    const wrapper =
`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_W} ${PAGE_H}" width="${PAGE_W}" height="${PAGE_H}">
<title>${titleSafe}</title>
<rect width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>
<text x="${PAGE_W / 2}" y="52" font-family="Georgia, serif" font-size="22" font-weight="700" text-anchor="middle">${titleSafe}</text>
${refSafe ? `<text x="${PAGE_W / 2}" y="76" font-family="Georgia, serif" font-size="12" fill="#555" text-anchor="middle">${refSafe}</text>` : ''}
<g transform="translate(${MARGIN_X}, ${HEADER_H}) scale(${(PAGE_W - MARGIN_X * 2) / 512})">${inner}</g>
${verseSafe ? `<text x="${PAGE_W / 2}" y="${ART_BOT + 32}" font-family="Georgia, serif" font-size="11" font-style="italic" fill="#444" text-anchor="middle">${verseSafe}</text>` : ''}
<text x="${PAGE_W / 2}" y="${PAGE_H - 18}" font-family="system-ui, sans-serif" font-size="8" fill="#bbb" text-anchor="middle">littleseed.app — Free Bible Coloring Sheet</text>
</svg>`;
    return {
      svg:      wrapper,
      width:    PAGE_W,
      height:   PAGE_H,
      byteSize: new Blob([wrapper]).size,
      runCount: 0,
    };
  }

  // PDF: try to use pdfjs-dist if available globally; otherwise raster fallback
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const bitmap = await pdfFirstPageToBitmap(file, maxSide);
    if (!bitmap) {
      throw new Error('Could not rasterise PDF. Try converting page 1 to PNG first.');
    }
    return traceBitmapToSvg(bitmap, opts);
  }

  // Raster (PNG/JPG/etc)
  const url = URL.createObjectURL(file);
  try {
    const img    = await loadImage(url);
    const scale  = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w      = Math.round(img.naturalWidth  * scale);
    const h      = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    return traceCanvasToSvg(ctx, w, h, opts);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Render a CanvasImageSource via offscreen canvas and trace. */
export function traceBitmapToSvg(
  bitmap: HTMLCanvasElement | ImageBitmap,
  opts:   ConvertOptions
): ConvertResult {
  const w = (bitmap as any).width  as number;
  const h = (bitmap as any).height as number;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bitmap as any, 0, 0);
  return traceCanvasToSvg(ctx, w, h, opts);
}

/**
 * Best-effort PDF rasteriser — uses pdfjs-dist if loaded via CDN
 * (`window.pdfjsLib`). Returns null when unavailable so the caller can
 * surface a friendly error instead of crashing.
 */
async function pdfFirstPageToBitmap(file: File, maxSide: number): Promise<HTMLCanvasElement | null> {
  const pdfjs = (typeof window !== 'undefined' && (window as any).pdfjsLib) || null;
  if (!pdfjs) {
    // Attempt one lazy CDN load (no bundling impact).
    try {
      await loadPdfjsFromCdn();
    } catch {
      return null;
    }
  }
  const lib = (window as any).pdfjsLib;
  if (!lib) return null;

  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxSide / viewport.width, maxSide / viewport.height, 2);
  const vp = page.getViewport({ scale });

  const c = document.createElement('canvas');
  c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return c;
}

function loadPdfjsFromCdn(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      try {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      } catch (e) { reject(e); }
    };
    s.onerror = () => reject(new Error('Failed to load pdf.js'));
    document.head.appendChild(s);
  });
}

/** Estimate kilobyte size of an SVG string. */
export function svgSizeKb(svg: string): string {
  return (new Blob([svg]).size / 1024).toFixed(1) + ' KB';
}
