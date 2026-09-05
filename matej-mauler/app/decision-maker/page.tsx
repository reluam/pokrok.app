import { DecisionMaker } from "@/components/DecisionMaker";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/decision-maker");

export default async function DecisionMakerPage() {
  await guardExperiment("decision-maker");
  const lang = await getLang();
  return <DecisionMaker lang={lang} />;
}
