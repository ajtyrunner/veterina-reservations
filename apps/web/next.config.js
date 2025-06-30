// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  const path = require('path')
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produkční optimalizace
  output: 'standalone',
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Environment variables pro klienta
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    API_URL: process.env.API_URL,
  },

  // Obrázky optimalizace
  images: {
    domains: ['lh3.googleusercontent.com'], // Google OAuth avatary
    formats: ['image/webp', 'image/avif'],
  },

  // Webpack optimalizace
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 