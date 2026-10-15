import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/light", destination: "/light/en", permanent: false },
      { source: "/dark", destination: "/dark/en", permanent: false },
      { source: "/en", destination: "/light/en", permanent: false },
      { source: "/ar", destination: "/light/ar", permanent: false },
    ];
  },
};

export default nextConfig;
