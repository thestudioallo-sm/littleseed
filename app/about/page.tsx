import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About LittleSeed — Free Bible Coloring Sheets for Missionaries',
  description:
    'LittleSeed provides free, printable Bible coloring sheets for missionaries, churches, and Sunday school teachers worldwide. Download SVG and PDF files in multiple languages.',
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Page heading */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">About LittleSeed</h1>
      <p className="text-blue-600 font-medium mb-8">
        Free Bible coloring sheets for children &amp; missionaries worldwide
      </p>

      {/* Mission */}
      <section aria-labelledby="mission-heading" className="mb-10">
        <h2 id="mission-heading" className="text-xl font-semibold text-gray-900 mb-3">
          Our Mission
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          LittleSeed exists to put quality Bible teaching materials into the hands of
          every missionary, Sunday school teacher, and church worker — regardless of
          location, budget, or internet speed.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Every coloring sheet is completely free to download, print, and use without
          restriction. There are no subscriptions, no watermarks, and no sign-up required.
        </p>
      </section>

      {/* How to use */}
      <section aria-labelledby="how-heading" className="mb-10">
        <h2 id="how-heading" className="text-xl font-semibold text-gray-900 mb-3">
          How to Use
        </h2>

        <ol className="space-y-4 text-gray-700">
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white
                             flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <strong className="block text-gray-900">Search</strong>
              Type a Bible story, theme, or keyword — Noah, Easter, forgiveness, love — and
              find matching coloring sheets instantly.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white
                             flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <strong className="block text-gray-900">Choose your language</strong>
              Select English, Korean, Spanish, French, or Portuguese. The Bible verse and
              title change to match — no separate image needed.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white
                             flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <strong className="block text-gray-900">Download &amp; print</strong>
              Click <em>Download PDF</em> for a print-ready file, or <em>Print</em> to
              send directly to your printer. SVG files are also available for editing.
            </div>
          </li>
        </ol>
      </section>

      {/* Design principles */}
      <section aria-labelledby="design-heading" className="mb-10">
        <h2 id="design-heading" className="text-xl font-semibold text-gray-900 mb-3">
          Built for the Field
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: '📶',
              title: 'Low bandwidth',
              body: 'SVG files are tiny. The whole site loads in under 2 seconds on slow 3G.',
            },
            {
              icon: '📱',
              title: 'Mobile-friendly',
              body: 'Works on any Android or iOS device. Large tap targets throughout.',
            },
            {
              icon: '🖨️',
              title: 'Print-optimised',
              body: 'Navigation and UI chrome are hidden when you print. Just the sheet and verse.',
            },
            {
              icon: '🌐',
              title: 'Works offline',
              body: 'Install the app and previously viewed sheets are available without internet.',
            },
            {
              icon: '♿',
              title: 'Accessible',
              body: 'High contrast, screen-reader labels, and keyboard-navigable throughout.',
            },
            {
              icon: '🆓',
              title: 'Always free',
              body: 'No account, no payment, no watermarks. Download as many as you need.',
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3 p-4 border border-gray-100 rounded-lg bg-gray-50"
            >
              <span aria-hidden="true" style={{ fontSize: '1.5rem', lineHeight: 1.2 }}>
                {icon}
              </span>
              <div>
                <strong className="block text-gray-900 text-sm mb-0.5">{title}</strong>
                <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Languages */}
      <section aria-labelledby="lang-heading" className="mb-10">
        <h2 id="lang-heading" className="text-xl font-semibold text-gray-900 mb-3">
          Supported Languages
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { code: '🇺🇸', name: 'English' },
            { code: '🇰🇷', name: '한국어 (Korean)' },
            { code: '🇪🇸', name: 'Español (Spanish)' },
            { code: '🇫🇷', name: 'Français (French)' },
            { code: '🇧🇷', name: 'Português (Portuguese)' },
          ].map(({ code, name }) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         border border-gray-200 bg-white text-sm text-gray-700"
            >
              <span aria-hidden="true">{code}</span> {name}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          More languages coming — contact us if you'd like to help translate.
        </p>
      </section>

      {/* Contributing */}
      <section aria-labelledby="contribute-heading" className="mb-10">
        <h2 id="contribute-heading" className="text-xl font-semibold text-gray-900 mb-3">
          Contribute
        </h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          LittleSeed is an open project. You can contribute by:
        </p>
        <ul className="text-gray-700 space-y-1.5 text-sm">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-blue-500">→</span>
            Drawing new coloring sheets (SVG, A4 format)
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-blue-500">→</span>
            Translating verse text into new languages
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-blue-500">→</span>
            Reporting accessibility issues or broken files
          </li>
        </ul>
      </section>

      {/* CTA */}
      <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
                     hover:bg-blue-700 text-center"
          style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Start searching
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg
                     font-semibold hover:bg-gray-50 text-center"
          style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Browse all sheets
        </Link>
      </div>
    </div>
  );
}
