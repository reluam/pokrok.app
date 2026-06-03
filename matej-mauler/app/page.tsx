import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spaghetti.ltd",
  description: dictionaries.en.meta.description,
  alternates: {
    canonical: "/",
    languages: { en: "/", cs: "/cs" },
  },
};

export default async function Home() {
  const items = await getPublicExperiments("en");
  return <HomeContent dict={dictionaries.en} lang="en" items={items} />;
}
