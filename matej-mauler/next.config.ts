import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Sekce „Jak to vidím" zanikla a „Čemu se věnuju teď" se stalo „Nad čím
    // přemýšlím". Redirect na nejbližší živou věc je lepší než 404 na odkazu,
    // který někde visí.
    return [
      { source: "/thoughts", destination: "/ideas", permanent: true },
      { source: "/projects", destination: "/ideas", permanent: true },
    ];
  },
};

export default nextConfig;
