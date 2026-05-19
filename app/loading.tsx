/**
 * Global loading UI — shown by Next.js while page segments stream in.
 * Kept CSS-only: zero JS, zero layout shift.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading…"
      className="flex items-center justify-center min-h-[40vh]"
    >
      {/* Pure CSS spinner — no library, no JS */}
      <span
        style={{
          display:      'inline-block',
          width:        36,
          height:       36,
          border:       '3px solid #e2e6ea',
          borderTop:    '3px solid #2563eb',
          borderRadius: '50%',
          animation:    'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
