import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Configuration for allowed qualities to avoid warnings
    qualities: [75, 95, 100],
  },
  experimental: {
    // Other experimental options can go here
  }
};




export default nextConfig;
