import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { PERSON_NAME } from "@/lib/about";
import { SECTIONS, sectionIndex } from "@/lib/site/sections";

const section = SECTIONS[sectionIndex("ideas")];

export const metadata: Metadata = {
  title: `${section.title.en} — ${PERSON_NAME}`,
  description: section.summary.en,
  alternates: { canonical: section.href },
  openGraph: {
    type: "profile",
    title: `${section.title.en} — ${PERSON_NAME}`,
    description: section.summary.en,
    url: section.href,
    siteName: PERSON_NAME,
    images: [{ url: "/logo.svg" }],
  },
};

export default function Page() {
  return <SiteShell section="ideas" />;
}
