/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      appDir: true, // because you selected App Router
    },
    images: {
      domains: [
        'firebasestorage.googleapis.com',
      ],
    }
  }
  
  module.exports = nextConfig
  