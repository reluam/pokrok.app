import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { getPublicSongs } from "@/lib/songsDb";
import { getLang } from "@/lib/getLang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Laboratoř — Spaghetti.ltd" };

// Původní homepage: feed experimentů + písničky. Brána encyklopedie na něj odkazuje.
export default async function ArchivPage() {
  const lang = await getLang();
  const [items, songs] = await Promise.all([getPublicExperiments(lang), getPublicSongs(lang, 3)]);
  return <HomeContent dict={dictionaries[lang]} lang={lang} items={items} songs={songs} />;
}
