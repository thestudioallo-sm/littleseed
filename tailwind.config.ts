import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Minimal custom tokens — no heavy palette
      colors: {
        brand: {
          50:  '#f0f7ff',
          100: '#dbeeff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      // Print-friendly line-heights
      lineHeight: {
        print: '1.6',
      },
    },
  },
  plugins: [],
};

export default config;
