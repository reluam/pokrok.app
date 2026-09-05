import { MusicExperience } from "@/components/MusicExperience";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/music");

export default async function MusicPage() {
  await guardExperiment("music");
  const lang = await getLang();
  return <MusicExperience lang={lang} />;
}
