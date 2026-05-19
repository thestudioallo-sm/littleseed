import Link from 'next/link';

export function Header() {
  return (
    <header
      className="no-print sticky top-0 z-10 bg-white border-b border-gray-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-blue-600 text-lg no-underline"
          style={{ minHeight: 44 }}
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22V12" />
            <path d="M5 3a7 7 0 0 0 7 7 7 7 0 0 0 7-7" />
            <path d="M5 3h14" />
          </svg>
          LittleSeed
        </Link>

        <nav aria-label="Site navigation" className="flex items-center gap-1">
          <Link
            href="/search"
            className="px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            Browse
          </Link>
          <Link
            href="/about"
            className="px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
