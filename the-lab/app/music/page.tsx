import { MusicExperience } from "@/components/MusicExperience";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jak vzniká hudba — The Lab",
  description: "Interaktivní hudební studio: poskládej skladbu po vrstvách — beat, basa, akordy a melodie. Mřížky, fadery a efekty jako v DAW.",
};

export default async function MusicPage() {
  const lang = await getLang();
  return <MusicExperience lang={lang} />;
}
