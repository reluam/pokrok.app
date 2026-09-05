import { SoundExperience } from "@/components/SoundExperience";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/sound");

export default async function SoundPage() {
  await guardExperiment("sound");
  const lang = await getLang();
  return <SoundExperience lang={lang} />;
}
