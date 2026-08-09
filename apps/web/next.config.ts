import type { NextConfig } from 'next';

const API_HOST = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).hostname
  : 'localhost';

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: API_HOST,
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
