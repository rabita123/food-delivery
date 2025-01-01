/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'xsgames.co', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    // Only enable source maps in development
    if (!dev) {
      config.devtool = false;
    }
    return config;
  },
}

module.exports = nextConfig 