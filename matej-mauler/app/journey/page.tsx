import { HumanJourney } from "@/components/HumanJourney";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Human Journey — Spaghetti.ltd" };

export default async function JourneyPage() {
  await guardExperiment("journey");
  const lang = await getLang();
  return <HumanJourney lang={lang} />;
}
