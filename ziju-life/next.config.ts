import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [256, 384, 640, 750, 828, 1080, 1200, 1920, 2048],
    qualities: [70, 75, 80, 85, 90],
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
      { source: "/blog", destination: "/feed", permanent: true },
      { source: "/blog/:path*", destination: "/feed", permanent: true },
      { source: "/inspirace", destination: "/feed", permanent: false },
      { source: "/inspirace/:path*", destination: "/feed", permanent: false },
      { source: "/jak-ziju", destination: "/muj-kompas", permanent: true },
      { source: "/manual", destination: "/laborator/tvuj-kompas", permanent: true },
      { source: "/manual/:path*", destination: "/laborator/tvuj-kompas", permanent: true },
      { source: "/audit-zivota", destination: "/laborator/tvuj-kompas", permanent: true },
      { source: "/audit-zivota/:path*", destination: "/laborator/tvuj-kompas", permanent: true },
      { source: "/navod-na-zivot", destination: "/muj-kompas", permanent: true },
      { source: "/muj-kompas", destination: "/feed", permanent: false },
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
