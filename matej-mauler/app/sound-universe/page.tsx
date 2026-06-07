import { SoundUniverse } from "@/components/SoundUniverse";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { getPublicSongs } from "@/lib/songsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sound Universe — Spaghetti.ltd" };

export default async function SoundUniversePage() {
  await guardExperiment("soundverse");
  const lang = await getLang();
  const songs = (await getPublicSongs(lang)).map((s) => ({ url: s.audioUrl, title: s.title }));
  return <SoundUniverse lang={lang} songs={songs} />;
}
