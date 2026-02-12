import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/blog", destination: "/inspirace", permanent: true },
      { source: "/blog/:path*", destination: "/inspirace/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
