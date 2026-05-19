'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { LanguageCode } from '@/lib/types';
import { SUPPORTED_LANGUAGES } from '@/lib/types';

interface LanguageSelectorProps {
  currentLang:   LanguageCode;
  availableLangs: LanguageCode[];
  label?:        string;
}

export function LanguageSelector({
  currentLang,
  availableLangs,
  label = 'Language',
}: LanguageSelectorProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const options = SUPPORTED_LANGUAGES.filter(
    (l) => availableLangs.includes(l.code as LanguageCode)
  );

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="lang-select" className="text-sm font-medium text-gray-700 shrink-0">
        {label}
      </label>
      <select
        id="lang-select"
        value={currentLang}
        onChange={handleChange}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm
                   bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
        style={{ minHeight: 44 }}
      >
        {options.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native_name}
          </option>
        ))}
      </select>
    </div>
  );
}
