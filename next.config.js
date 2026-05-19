/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      urlPattern: /\/coloring\/.*\.(svg|pdf|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'coloring-assets',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Optimize images — WebP only, no heavy next/image processing for SVG
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Reduce bundle: no powered-by header
  poweredByHeader: false,

  // Strict content-security
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],

  experimental: {
    // Keep bundle lean
    optimizePackageImports: ['@supabase/supabase-js'],
  },
};

module.exports = withPWA(nextConfig);
