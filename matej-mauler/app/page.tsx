import type { Metadata } from "next";
import { EncyclopediaShell } from "@/components/encyclopedia/Shell";
import { dictionaries } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spaghetti.ltd",
  description: dictionaries.en.meta.description,
  alternates: {
    canonical: "/",
    languages: { en: "/", cs: "/cs" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Spaghetti.ltd",
  alternateName: "Spaghetti encyclopedia",
  url: "https://spaghetti.ltd",
  description: "An interactive encyclopedia where every term gets a witty explanation and is connected to related terms by knowledge noodles.",
  inLanguage: ["cs", "en"],
};

// Brána encyklopedie — heslo nad vesmírem. Scroll dolů = do vesmíru.
export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <EncyclopediaShell initialSlug="brana" lang="en" />
    </>
  );
}
