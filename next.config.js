/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [],
      disableStaticImages: false,
      domains: [],
      unoptimized: true
    },
    transpilePackages: ['langchain'],
    experimental: {
      turbo: {
        enabled: true,
      },
      serverActions: {
        allowedOrigins: [
          // Conditionally include NEXT_PUBLIC_SITE_URL if defined
          ...(process.env.NEXT_PUBLIC_SITE_URL
            ? [process.env.NEXT_PUBLIC_SITE_URL]
            : []),
          // 'http://localhost:3000',
          'http://localhost:3000',
          '3.81.126.90:3000', // Added 'http://' protocol
          '54.158.141.213:3002',
          'https://3000-01j5j4y121wvcn8hk8bzf11kky.cloudspaces.litng.ai',
        ],
      },
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        };
      }
      return config;
    },
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Forwarded-Host',
              value: '$http_x_forwarded_host',
            },
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, DELETE, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization',
            },
          ],
        },
      ];
    },
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ];
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
        NEXT_PUBLIC_MESSAGING_CONSENT_URL: process.env.NEXT_PUBLIC_MESSAGING_CONSENT_URL,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
      },
    typescript: {
      ignoreBuildErrors: false,
    },
  };
  
  module.exports = nextConfig;