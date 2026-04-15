import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Static export — lets Vercel serve web/out as plain static files from the
  // snaps/ repo root. This avoids having to change the Vercel "Root Directory"
  // setting in the dashboard. Once we need full Next.js runtime features
  // (middleware, server actions, ISR), switch to standalone output and flip
  // Vercel Root Directory to snaps/web.
  output: 'export',

  // Required for static export — Next.js won't run the image optimizer.
  images: { unoptimized: true },

  // Shared TS files live one directory up (snaps/data, snaps/types, snaps/lib).
  // Tell Next's file tracing to include the parent snaps/ dir so Vercel picks them up.
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Allow importing .ts files from outside the web/ root (../data, ../types, ../lib)
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
