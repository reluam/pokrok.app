import { BrainApp } from "@/components/BrainApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Veřejný mozek — Spaghetti.ltd",
  description: "Slovo → asociace. Každá odpověď posílí synapsi ve společném mozku internetu. Explorer přidává asociace, Researcher zkoumá mapu synapsí.",
};

export default async function BrainPage() {
  await guardExperiment("brain");
  const lang = await getLang();
  return <BrainApp lang={lang} />;
}
