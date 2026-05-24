'use client';

interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = 'Print or Save as PDF' }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                 bg-blue-600 text-white font-semibold text-sm
                 hover:bg-blue-700 active:bg-blue-800"
      style={{ minHeight: 52 }}
      title="Opens your browser's print dialog. Choose 'Save as PDF' to download as PDF, or send to a printer."
    >
      {/* Printer icon — inline SVG, no library */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round"
           strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
