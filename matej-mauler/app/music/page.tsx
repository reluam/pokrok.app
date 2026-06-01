import { MusicMakerApp } from "@/components/MusicMakerApp";
import { getLang } from "@/lib/getLang";
import { getFinishedSongs } from "@/lib/musicServer";
import type { FinishedItem } from "@/lib/music";

export const dynamic = "force-dynamic";
export const metadata = { title: "Skládačka hudby — Spaghetti.ltd" };

export default async function MusicPage() {
  const lang = await getLang();
  let finished: FinishedItem[] = [];
  try { finished = await getFinishedSongs(); } catch { finished = []; }
  return <MusicMakerApp lang={lang} finished={finished} />;
}
