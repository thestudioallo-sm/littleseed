'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

interface SearchBarProps {
  initialValue?: string;
  placeholder?:  string;
  autoFocus?:    boolean;
}

export function SearchBar({
  initialValue = '',
  placeholder  = 'Search Bible stories, verses, themes…',
  autoFocus    = false,
}: SearchBarProps) {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('q', q);
    params.delete('page'); // reset pagination on new search

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex gap-2 w-full"
    >
      <label htmlFor="search-input" className="sr-only">
        Search Bible coloring sheets
      </label>
      <input
        id="search-input"
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300
                   focus:border-blue-500 focus:outline-none
                   text-base bg-white text-gray-900 placeholder-gray-400"
        style={{ minHeight: 52 }}
      />
      <button
        type="submit"
        className="px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold
                   hover:bg-blue-700 active:bg-blue-800
                   disabled:opacity-50 shrink-0"
        style={{ minHeight: 52 }}
      >
        Search
      </button>
    </form>
  );
}
