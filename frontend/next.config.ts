import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Accept images from any domain (user-uploaded photos, bookmaker logos)
    // Switch to specific remotePatterns once image hosting is decided
    unoptimized: true,
  },
};

export default nextConfig;
