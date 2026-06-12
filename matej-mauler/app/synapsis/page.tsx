import { BrainApp } from "@/components/BrainApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Synapse — Spaghetti.ltd",
  description: "Slovo → asociace. Každá odpověď posílí synapsi ve společné síti internetu. Explorer přidává asociace, Researcher zkoumá mapu synapsí.",
  alternates: { canonical: "/synapsis" },
};

export default async function SynapsePage() {
  await guardExperiment("brain");
  const lang = await getLang();
  return <BrainApp lang={lang} />;
}
