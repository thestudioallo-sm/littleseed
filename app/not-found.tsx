import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found — LittleSeed',
};

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p
        aria-hidden="true"
        style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '1rem' }}
      >
        🎨
      </p>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Page not found
      </h1>
      <p className="text-gray-500 mb-8">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
                     hover:bg-blue-700 active:bg-blue-800"
          style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Go to homepage
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg
                     font-semibold hover:bg-gray-50"
          style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Browse all sheets
        </Link>
      </div>

      {/* Quick keyword chips */}
      <div className="mt-10">
        <p className="text-sm text-gray-400 mb-3">Try searching for:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Noah', 'Easter', 'Jesus', 'David', 'Jonah'].map((kw) => (
            <Link
              key={kw}
              href={`/search?q=${encodeURIComponent(kw)}`}
              className="px-3 py-1.5 rounded-full border border-gray-200
                         text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
              style={{ minHeight: 36 }}
            >
              {kw}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
