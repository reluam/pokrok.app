import { RadioApp } from "@/components/RadioApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Radio — Spaghetti.ltd",
  description: "Server-rendered radio: an endless mastered track that listeners tune every 15 seconds by voting — melody, beat, bass, instrument, tempo, key.",
};

export default async function RadioPage() {
  await guardExperiment("radio");
  const lang = await getLang();
  return <RadioApp lang={lang} />;
}
