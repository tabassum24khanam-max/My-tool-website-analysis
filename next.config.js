/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'playwright'],
  },
};

module.exports = nextConfig;
