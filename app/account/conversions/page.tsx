import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser, getConversionHistory } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Conversion History — LittleSeed' };

const STATUS_BADGE: Record<string, string> = {
  clear: '✓ Clear',
  warn:  '⚠️ Review',
  block: '🚫 Blocked',
};

const MODE_LABEL: Record<string, string> = {
  bw:        'B&W',
  grayscale: 'Grayscale',
  outline:   'Outline',
};

export default async function ConversionsPage() {
  const user = await getUser();
  if (!user) redirect('/?auth_required=1');

  const history = await getConversionHistory();

  return (
    <main className="wrap" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ fontSize: '.85rem', color: 'var(--muted)' }}>← Home</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px' }}>
          📋 Conversion History
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
          {history.length === 0
            ? 'No conversions yet.'
            : `${history.length} conversion${history.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
          <p>Use the <strong>Mission Content Converter</strong> to convert and save sheets.</p>
          <Link href="/convert" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>
            Open Converter
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item: any) => (
            <div
              key={item.id}
              style={{
                border: '1px solid var(--border)', borderRadius: '10px',
                padding: '14px 16px', background: 'var(--surface)',
                display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '4px' }}>
                  {item.title || item.original_filename || 'Untitled'}
                </div>
                {item.verse && (
                  <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    {item.verse.slice(0, 100)}{item.verse.length > 100 ? '…' : ''}
                  </div>
                )}
                <div style={{ fontSize: '.75rem', color: '#aaa' }}>
                  {new Date(item.created_at).toLocaleDateString()} &nbsp;·&nbsp;
                  {item.language_code?.toUpperCase()} &nbsp;·&nbsp;
                  {MODE_LABEL[item.print_mode] || item.print_mode}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span style={{
                  fontSize: '.7rem', fontWeight: 700, padding: '2px 8px',
                  borderRadius: '4px',
                  background: item.copyright_status === 'clear' ? '#d1fae5'
                            : item.copyright_status === 'warn'  ? '#fef3c7' : '#fee2e2',
                  color:      item.copyright_status === 'clear' ? '#065f46'
                            : item.copyright_status === 'warn'  ? '#92400e' : '#991b1b',
                }}>
                  {STATUS_BADGE[item.copyright_status] || item.copyright_status}
                </span>
                {item.published && (
                  <span style={{
                    fontSize: '.7rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8'
                  }}>
                    🌐 Published
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
