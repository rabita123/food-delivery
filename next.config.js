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
}

module.exports = nextConfig 