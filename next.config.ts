import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Backend image proxy (course thumbnails from S3 in production)
      {
        protocol: 'https',
        hostname: 'goldfish-app-d9t4j.ondigitalocean.app',
        pathname: '/api/media/image',
      },
      // S3 storage (Kailesh Cloud / DataHub) – course thumbnails, events, gallery, etc.
      {
        protocol: 'https',
        hostname: 's3-np1.datahub.com.np',
      },
      // Legacy Cloudinary (if any old URLs still in DB)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'http',
        hostname: 'example.com',
      },
      // Allow all hostnames for development (you can restrict this in production)
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Allow unoptimized images for external domains that might not be configured
    unoptimized: false,
    // Configure image qualities to fix warnings
    qualities: [75, 90],
  },
  // Optimize compilation and prevent hanging
  experimental: {
    // Reduce memory usage during compilation
    optimizePackageImports: ['react-icons'],
  },
  // Reduce bundle size
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
};

export default nextConfig;
