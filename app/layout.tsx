import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: {
    default:  'LittleSeed — Free Bible Coloring Sheets',
    template: '%s | LittleSeed',
  },
  description:
    'Free printable Bible coloring sheets for children, Sunday school, and missionaries in English, Korean, Spanish, French, and Portuguese.',
  keywords: [
    'bible coloring sheets', 'sunday school printables', 'missionary resources',
    'free bible coloring pages', 'christian coloring sheets', 'kids bible activities',
  ],
  openGraph: {
    type:        'website',
    siteName:    'LittleSeed',
    title:       'LittleSeed — Free Bible Coloring Sheets',
    description: 'Printable Bible coloring sheets for children & missionaries worldwide.',
  },
  robots: {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://littleseed.app',
  },
};

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  themeColor:         '#2563eb',
  colorScheme:        'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="no-print border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          <p>
            LittleSeed &mdash; Free Bible Coloring Sheets &mdash;{' '}
            <a href="/about" className="underline hover:text-gray-700">About</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
