import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: false as any,
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  serverExternalPackages: ['pino'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
