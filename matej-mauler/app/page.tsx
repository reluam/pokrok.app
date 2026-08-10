import type { Metadata } from "next";
import { HomeCard } from "@/components/HomeCard";
import { CONTACTS, EMAIL, PERSON_NAME, PERSON_URL } from "@/lib/about";
import { dictionaries } from "@/lib/dictionaries";
import { projects } from "@/lib/projects";
import { applyTextOverrides, getTextOverrides } from "@/lib/siteTextsDb";

const positioning = dictionaries.en.about.description;

// Homepage je cacheovaná (ne force-dynamic): texty se drží ve full-route cache a
// admin změny ji shodí přes revalidateTag → návrat na „/" je instant místo dynamického renderu.
export const metadata: Metadata = {
  title: `${PERSON_NAME} — sales, music, web experiments`,
  description: positioning,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    title: `${PERSON_NAME} — sales, music, web experiments`,
    description: positioning,
    url: PERSON_URL,
    siteName: PERSON_NAME,
    // TODO: nahradit skutečným OG obrázkem (1200×630), zatím logo jako placeholder
    images: [{ url: "/logo.svg" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PERSON_NAME,
  url: PERSON_URL,
  email: `mailto:${EMAIL}`,
  description: positioning,
  sameAs: [
    ...CONTACTS.filter((c) => c.external).map((c) => c.href),
    ...projects.map((p) => p.url).filter((u): u is string => !!u),
  ],
};

export default async function Home() {
  const overrides = await getTextOverrides("en").catch(() => ({}));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeCard dict={applyTextOverrides(dictionaries.en, overrides)} />
    </>
  );
}
