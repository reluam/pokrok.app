import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { getPublicSongs } from "@/lib/songsDb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spaghetti.ltd",
  description: dictionaries.cs.meta.description,
  alternates: {
    canonical: "/cs",
    languages: { en: "/", cs: "/cs" },
  },
};

export default async function HomeCs() {
  const [items, songs] = await Promise.all([getPublicExperiments("cs"), getPublicSongs("cs", 3)]);
  return <HomeContent dict={dictionaries.cs} lang="cs" items={items} songs={songs} />;
}
