const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.sanity.io'],
  },
  // Ensure JSON files are properly bundled
  webpack: (config, { isServer }) => {
    // Make sure JSON files are included in the bundle
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.json': ['.json'],
    }
    return config
  },
}

module.exports = withNextIntl(nextConfig)
