import { SoundBlasterBook } from "@/components/SoundBlasterBook";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { getPublicSongs } from "@/lib/songsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sound Blaster — Spaghetti.ltd" };

export default async function SoundBlasterPage() {
  await guardExperiment("soundverse");
  const lang = await getLang();
  const songs = (await getPublicSongs(lang)).map((s) => ({ url: s.audioUrl, title: s.title }));
  return <SoundBlasterBook lang={lang} songs={songs} />;
}
