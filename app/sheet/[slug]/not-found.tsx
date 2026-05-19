import Link from 'next/link';

export default function SheetNotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4" aria-hidden="true">🎨</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sheet not found</h1>
      <p className="text-gray-500 mb-6">
        This coloring sheet doesn't exist or may have been moved.
      </p>
      <Link
        href="/search"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
      >
        Browse all sheets
      </Link>
    </div>
  );
}
