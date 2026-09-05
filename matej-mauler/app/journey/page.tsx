import { HumanJourney } from "@/components/HumanJourney";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/journey");

export default async function JourneyPage() {
  await guardExperiment("journey");
  const lang = await getLang();
  return <HumanJourney lang={lang} />;
}
