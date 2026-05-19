/** @type {import('next').NextConfig} */
// next-pwa disabled for now — re-enable after core deploy is stable
// const withPWA = require('next-pwa')({ dest: 'public', ... });

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

};

module.exports = nextConfig;
