import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser, getSavedSheets } from '@/lib/auth';
import type { ColoringPage } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Saved Sheets — LittleSeed' };

export default async function SavedPage() {
  const user = await getUser();
  if (!user) redirect('/?auth_required=1');

  const sheets = (await getSavedSheets()) as ColoringPage[];

  return (
    <main className="wrap" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ fontSize: '.85rem', color: 'var(--muted)' }}>← Home</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px' }}>
          🔖 Saved Sheets
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
          {sheets.length === 0
            ? 'No saved sheets yet.'
            : `${sheets.length} sheet${sheets.length > 1 ? 's' : ''} saved`}
        </p>
      </div>

      {sheets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔖</div>
          <p>Open any coloring sheet and tap <strong>Save</strong> to bookmark it here.</p>
          <Link href="/search" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>
            Browse sheets
          </Link>
        </div>
      ) : (
        <div className="grid">
          {sheets.map(sheet => (
            <Link
              key={sheet.id}
              href={`/sheet/${sheet.slug}`}
              className="sheet-card"
            >
              {sheet.thumbnail_url ? (
                <img
                  src={sheet.thumbnail_url}
                  alt={sheet.bible_story}
                  className="sheet-thumb"
                />
              ) : (
                <div className="sheet-thumb placeholder">🎨</div>
              )}
              <div className="sheet-info">
                <div className="sheet-title">{sheet.bible_story}</div>
                <div className="sheet-meta">{sheet.age_group} · {sheet.difficulty}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
