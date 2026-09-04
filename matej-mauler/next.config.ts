import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Osobní rozcestník se přestěhoval z kořene pod „/matej" (na „/" je zase
    // Spaghetti.ltd). Sekce „Jak to vidím" zanikla a „Čemu se věnuju teď" se
    // stalo „Nad čím přemýšlím". Redirect na nejbližší živou věc je lepší než
    // 404 na odkazu, který někde visí.
    return [
      { source: "/work", destination: "/matej/work", permanent: true },
      { source: "/contact", destination: "/matej/contact", permanent: true },
      { source: "/ideas", destination: "/matej/ideas", permanent: true },
      { source: "/thoughts", destination: "/matej/ideas", permanent: true },
      { source: "/projects", destination: "/matej/ideas", permanent: true },
    ];
  },
};

export default nextConfig;
