import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { getPublicSongs } from "@/lib/songsDb";
import { applyTextOverrides, getTextOverrides } from "@/lib/siteTextsDb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spaghetti.ltd",
  description: dictionaries.en.meta.description,
  alternates: {
    canonical: "/",
    languages: { "x-default": "/", en: "/", cs: "/cs" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Spaghetti.ltd",
  url: "https://www.spaghetti.ltd",
  description: "Interactive experiments and an encyclopedia connected by knowledge noodles — sound, music, a server-rendered radio, a public brain and more.",
  inLanguage: ["cs", "en"],
};

export default async function Home() {
  const [items, songs] = await Promise.all([getPublicExperiments("en"), getPublicSongs("en", 3)]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeContent dict={applyTextOverrides(dictionaries.en, await getTextOverrides("en").catch(() => ({})))} lang="en" items={items} songs={songs} />
    </>
  );
}
