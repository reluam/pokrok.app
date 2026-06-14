import type { Metadata } from "next";
import { HomeNetwork } from "@/components/HomeNetwork";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { applyTextOverrides, getTextOverrides } from "@/lib/siteTextsDb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spaghetti.ltd",
  description: dictionaries.cs.meta.description,
  alternates: {
    canonical: "/cs",
    languages: { "x-default": "/", en: "/", cs: "/cs" },
  },
};

export default async function HomeCs() {
  const items = await getPublicExperiments("cs");
  return <HomeNetwork dict={applyTextOverrides(dictionaries.cs, await getTextOverrides("cs").catch(() => ({})))} lang="cs" items={items} />;
}
