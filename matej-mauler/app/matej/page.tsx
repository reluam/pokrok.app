import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { CONTACTS, EMAIL, PERSON_NAME, PERSON_URL } from "@/lib/about";
import { projects } from "@/lib/projects";
import { COPY } from "@/lib/site/copy";

const positioning = COPY.metaDescription.en;

export const metadata: Metadata = {
  title: `${PERSON_NAME} — sales, music, web experiments`,
  description: positioning,
  alternates: { canonical: "/matej" },
  openGraph: {
    type: "profile",
    title: `${PERSON_NAME} — sales, music, web experiments`,
    description: positioning,
    url: "/matej",
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

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteShell section="home" />
    </>
  );
}
