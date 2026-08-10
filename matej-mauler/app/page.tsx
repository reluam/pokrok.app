import type { Metadata } from "next";
import { HomeCard } from "@/components/HomeCard";
import { CONTACTS, EMAIL } from "@/lib/about";
import { dictionaries } from "@/lib/dictionaries";
import { applyTextOverrides, getTextOverrides } from "@/lib/siteTextsDb";

// Homepage je cacheovaná (ne force-dynamic): texty se drží ve full-route cache a
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
  "@type": "Person",
  name: "Matěj Mauler",
  url: "https://www.spaghetti.ltd",
  email: `mailto:${EMAIL}`,
  description: dictionaries.en.about.p2,
  sameAs: CONTACTS.filter((c) => c.external).map((c) => c.href),
};

export default async function Home() {
  const overrides = await getTextOverrides("en").catch(() => ({}));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeCard dict={applyTextOverrides(dictionaries.en, overrides)} lang="en" />
    </>
  );
}
