// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  const path = require('path')
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produkční optimalizace
  output: 'standalone',
  
  // API Proxy rewrites - pouze pro development
  async rewrites() {
    // V produkci nepoužíváme rewrites - frontend volá API přímo
    if (process.env.NODE_ENV === 'production') {
      return []
    }
    
    // Pro development - proxy na lokální API server
    const apiUrl = process.env.API_URL || 'http://lvh.me:4000'
    return [
      {
        source: '/api/public/:path*',
        destination: `${apiUrl}/api/public/:path*`,
      },
      {
        source: '/api/protected/:path*',
        destination: `${apiUrl}/api/protected/:path*`,
      },
      {
        source: '/api/doctors',
        destination: `${apiUrl}/api/doctors`,
      },
      {
        source: '/api/doctors/:path*',
        destination: `${apiUrl}/api/doctors/:path*`,
      },
      {
        source: '/api/slots/:path*',
        destination: `${apiUrl}/api/slots/:path*`,
      },
      {
        source: '/api/service-types/:path*',
        destination: `${apiUrl}/api/service-types/:path*`,
      },
      {
        source: '/api/reservations',
        destination: `${apiUrl}/api/reservations`,
      },
      {
        source: '/api/reservations/:path*',
        destination: `${apiUrl}/api/reservations/:path*`,
      },
      {
        source: '/api/rooms',
        destination: `${apiUrl}/api/rooms`,
      },
      {
        source: '/api/rooms/:path*',
        destination: `${apiUrl}/api/rooms/:path*`,
      },
      // Nezahrnujeme /api/auth/* - to zpracovává NextAuth přímo
    ]
  },

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
    // NEXTAUTH_URL odstraněn - nastavuje se dynamicky v runtime
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'G-9L3Q6MQVS5',
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