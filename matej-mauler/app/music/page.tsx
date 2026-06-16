import { MusicExperience } from "@/components/MusicExperience";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "How music is made — Spaghetti.ltd",
  description: "Interactive music studio: build a track layer by layer — beat, bass, chords and melody. Grids, faders and effects like in a DAW.",
};

export default async function MusicPage() {
  await guardExperiment("music");
  const lang = await getLang();
  return <MusicExperience lang={lang} />;
}
