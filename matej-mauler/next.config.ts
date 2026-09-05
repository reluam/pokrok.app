import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Osobní web se scvrkl z pěti stránek na kořeni na jedinou „/matej"
    // (na „/" je zase Spaghetti.ltd). Všechny bývalé sekce vedou tam —
    // redirect je lepší než 404 na odkazu, který někde visí.
    return [
      // /cs je historická česká adresa. Redirect patří sem, ne do page komponenty:
      // permanentRedirect() v komponentě vrací 200 s meta-refresh, tohle skutečnou 308.
      { source: "/cs", destination: "/?lang=cs", permanent: true },
      { source: "/work", destination: "/matej", permanent: true },
      { source: "/contact", destination: "/matej", permanent: true },
      { source: "/ideas", destination: "/matej", permanent: true },
      { source: "/thoughts", destination: "/matej", permanent: true },
      { source: "/projects", destination: "/matej", permanent: true },
      { source: "/matej/:path*", destination: "/matej", permanent: true },
    ];
  },
};

export default nextConfig;
