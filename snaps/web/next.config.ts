import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Image optimizer off — simplest for our needs.
  images: { unoptimized: true },

  // Shared TS files live one directory up (snaps/data, snaps/types, snaps/lib).
  // Tell Next's file tracing — and Turbopack — to treat snaps/ as the root
  // so imports from ../data, ../types, ../lib are picked up on Vercel.
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Allow importing .ts files from outside the web/ root (../data, ../types, ../lib)
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
