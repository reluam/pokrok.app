import { BrainApp } from "@/components/BrainApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/synapsis");

export default async function SynapsePage() {
  await guardExperiment("brain");
  const lang = await getLang();
  return <BrainApp lang={lang} />;
}
