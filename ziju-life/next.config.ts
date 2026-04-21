import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [256, 384, 640, 750, 828, 1080, 1200, 1920, 2048],
    qualities: [70, 75, 80, 85, 90],
    remotePatterns: [
      { protocol: "https", hostname: "substackcdn.com" },
      { protocol: "https", hostname: "substack-post-media.s3.amazonaws.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/feed", destination: "/knihovna", permanent: true },
      { source: "/feed/:path*", destination: "/knihovna/:path*", permanent: true },
      { source: "/blog", destination: "/knihovna", permanent: true },
      { source: "/blog/:path*", destination: "/knihovna", permanent: true },
      { source: "/inspirace", destination: "/knihovna", permanent: false },
      { source: "/inspirace/:path*", destination: "/knihovna", permanent: false },
      { source: "/jak-ziju", destination: "/knihovna", permanent: true },
      { source: "/audit-zivota", destination: "/knihovna", permanent: true },
      { source: "/audit-zivota/:path*", destination: "/knihovna", permanent: true },
      { source: "/navod-na-zivot", destination: "/knihovna", permanent: true },
      { source: "/muj-kompas", destination: "/knihovna", permanent: true },
      { source: "/manual", destination: "/knihovna", permanent: true },
      { source: "/manual/:path*", destination: "/knihovna", permanent: true },
      { source: "/laborator", destination: "/knihovna", permanent: true },
      { source: "/laborator/:path*", destination: "/knihovna", permanent: true },
      { source: "/dilna", destination: "/knihovna", permanent: true },
      { source: "/dilna/:path*", destination: "/knihovna", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // form.ziju.life (kořen) → funnel
      { source: "/", has: [{ type: "host", value: "form.ziju.life" }], destination: "/form/koucing" },
      // coaching.ziju.life (kořen) → funnel
      { source: "/", has: [{ type: "host", value: "coaching.ziju.life" }], destination: "/form/koucing" },
    ];
  },
};

export default nextConfig;
