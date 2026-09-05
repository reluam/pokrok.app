import { SoundFoundryApp } from "@/components/SoundFoundryApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/sound-foundry");

export default async function SoundFoundryPage() {
  await guardExperiment("foundry");
  const lang = await getLang();
  return <SoundFoundryApp lang={lang} />;
}
