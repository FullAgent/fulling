import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Docker image consumes the standalone output. Vercel still uses its
  // native Next.js build output and does not require a vercel.json file.
  output: 'standalone',
  compress: true,
  allowedDevOrigins: ['127.0.0.1'],
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
