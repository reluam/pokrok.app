import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
