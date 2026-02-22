import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [256, 384, 640, 750, 828, 1080, 1200, 1920, 2048],
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
      { source: "/blog", destination: "/inspirace", permanent: true },
      { source: "/blog/:path*", destination: "/inspirace/:path*", permanent: true },
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
