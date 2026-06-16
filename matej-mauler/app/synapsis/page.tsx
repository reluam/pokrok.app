import { BrainApp } from "@/components/BrainApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Synapse — Spaghetti.ltd",
  description: "Word → association. Every answer strengthens a synapse in the internet's shared network. Explorer adds associations, Researcher explores the synapse map.",
  alternates: { canonical: "/synapsis" },
};

export default async function SynapsePage() {
  await guardExperiment("brain");
  const lang = await getLang();
  return <BrainApp lang={lang} />;
}
