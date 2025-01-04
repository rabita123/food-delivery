/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'localhost', 
      'bkoalanbgfxqzegoxqbj.supabase.co',
      'images.unsplash.com'
    ],
  },
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    modern: true
  },
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig 