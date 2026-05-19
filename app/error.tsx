'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error:  Error & { digest?: string };
  reset:  () => void;
}

/**
 * Global error boundary — rendered when an unhandled error bubbles up.
 * Must be a Client Component (Next.js requirement for error.tsx).
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console in development; swap for Sentry/LogFlare in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div
        aria-hidden="true"
        style={{ fontSize: '3rem', marginBottom: '1rem' }}
      >
        ⚠️
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        The page couldn't load. This may be a temporary network issue.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
                     hover:bg-blue-700 active:bg-blue-800"
          style={{ minHeight: 48 }}
        >
          Try again
        </button>
        <a
          href="/"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg
                     font-semibold hover:bg-gray-50 flex items-center justify-center"
          style={{ minHeight: 48 }}
        >
          Go home
        </a>
      </div>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre className="mt-8 text-left text-xs bg-red-50 border border-red-200
                        rounded p-4 text-red-700 overflow-auto">
          {error.message}
        </pre>
      )}
    </div>
  );
}
