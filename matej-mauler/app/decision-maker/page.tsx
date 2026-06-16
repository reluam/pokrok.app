import { DecisionMaker } from "@/components/DecisionMaker";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Decision Maker — Spaghetti.ltd",
  description: "A tool for deciding when you're stuck at 50/50. Pros and cons with weights, a physical tug-of-war and the moment of cutting off (decidere).",
  alternates: { canonical: "/decision-maker" },
};

export default async function DecisionMakerPage() {
  await guardExperiment("decision-maker");
  const lang = await getLang();
  return <DecisionMaker lang={lang} />;
}
