import { MusicExperience } from "@/components/MusicExperience";
import { getLang } from "@/lib/lang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jak vzniká hudba — The Lab",
  description: "Interaktivní hudební studio: poskládej skladbu po vrstvách — beat, basa, akordy a melodie. Mřížky, fadery a efekty jako v DAW.",
};

export default async function MusicPage() {
  await guardExperiment("music");
  const lang = await getLang();
  return <MusicExperience lang={lang} />;
}
