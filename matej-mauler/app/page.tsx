import type { Metadata } from "next";
import { HomeNetwork } from "@/components/HomeNetwork";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { applyTextOverrides, getTextOverrides } from "@/lib/siteTextsDb";

// Homepage je cacheovaná (ne force-dynamic): feed i texty se drží ve full-route cache a
// admin změny ji shodí přes revalidateTag → návrat na „/" je instant místo dynamického renderu.
export const metadata: Metadata = {
  title: "Spaghetti.ltd",
  description: dictionaries.en.meta.description,
  alternates: {
    canonical: "/",
    languages: { "x-default": "/", en: "/" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Spaghetti.ltd",
  url: "https://www.spaghetti.ltd",
  description: "Interactive experiments and an encyclopedia connected by knowledge noodles — sound, music, a server-rendered radio, a public brain and more.",
  inLanguage: "en",
};

export default async function Home() {
  const [items, overrides] = await Promise.all([
    getPublicExperiments("en"),
    getTextOverrides("en").catch(() => ({})),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeNetwork dict={applyTextOverrides(dictionaries.en, overrides)} lang="en" items={items} />
    </>
  );
}
