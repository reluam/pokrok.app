import type { Metadata } from "next";
import { HomeNetwork } from "@/components/HomeNetwork";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { applyTextOverrides, getTextOverrides } from "@/lib/siteTextsDb";

export const dynamic = "force-dynamic";

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
  const items = await getPublicExperiments("en");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeNetwork dict={applyTextOverrides(dictionaries.en, await getTextOverrides("en").catch(() => ({})))} lang="en" items={items} />
    </>
  );
}
