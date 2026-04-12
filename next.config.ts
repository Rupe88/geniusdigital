import type { NextConfig } from "next";

/** next/image: allow backend media proxy host from NEXT_PUBLIC_API_URL when set. */
function apiMediaRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  try {
    const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!raw) throw new Error("unset");
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const protocol = u.protocol === "http:" ? ("http" as const) : ("https" as const);
    return [{ protocol, hostname: u.hostname, pathname: "/api/media/image" }];
  } catch {
    return [
      {
        protocol: "https",
        hostname: "stingray-app-2-iy8as.ondigitalocean.app",
        pathname: "/api/media/image",
      },
    ];
  }
}

const nextConfig: NextConfig = {
  // Production Docker / smaller deploy bundle (DigitalOcean App Platform, etc.)
  output: "standalone",
  turbopack: { root: process.cwd() },
  /**
   * Netlify (HTTPS) → HTTP droplet: mixed content blocks `http://` API calls from the browser.
   * Use a dedicated prefix so we do not shadow this app's own `app/api/*` routes.
   * Netlify build env: BACKEND_HTTP_ORIGIN=http://DROPLET_IP
   * NEXT_PUBLIC_API_URL=https://YOUR_SITE.netlify.app/backend-proxy/api
   */
  async rewrites() {
    const origin = process.env.BACKEND_HTTP_ORIGIN?.trim();
    if (!origin) return [];
    const base = origin.replace(/\/$/, "");
    return [
      {
        source: "/backend-proxy/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...apiMediaRemotePatterns(),
      // S3 storage (Kailesh Cloud / DataHub) – course thumbnails, events, gallery, etc.
      {
        protocol: 'https',
        hostname: 's3-np1.datahub.com.np',
      },
      // Thumbnail links pasted by admins (Google Drive direct view, etc.)
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
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
