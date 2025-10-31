/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.sanity.io'],
  },
  // Removed i18n config as it's not compatible with App Router
  // i18n configuration is now handled in middleware.ts
}

module.exports = nextConfig
