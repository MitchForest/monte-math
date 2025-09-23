/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@monte/shared'],
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig