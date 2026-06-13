import { DecisionMaker } from "@/components/DecisionMaker";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Decision Maker — Spaghetti.ltd",
  description: "Nástroj na rozhodování, když jsi zaseknutý na 50/50. Pro a proti s vahami, fyzikální přetahování a moment odříznutí (decidere).",
  alternates: { canonical: "/decision-maker" },
};

export default async function DecisionMakerPage() {
  await guardExperiment("decision-maker");
  const lang = await getLang();
  return <DecisionMaker lang={lang} />;
}
