import { MusicVoteApp } from "@/components/MusicVoteApp";
import { getLang } from "@/lib/getLang";
import { getMusicState } from "@/lib/musicServer";
import type { MusicState } from "@/lib/music";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hlasování o hudbě — Spaghetti.ltd" };

export default async function MusicPage() {
  const lang = await getLang();
  let initial: MusicState | null = null;
  try { initial = await getMusicState(); } catch { initial = null; }
  return <MusicVoteApp lang={lang} initial={initial} />;
}
