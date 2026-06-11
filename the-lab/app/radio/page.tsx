import { RadioApp } from "@/components/RadioApp";
import { getLang } from "@/lib/lang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rádio — The Lab",
  description: "Rádio renderované na serveru: nekonečná zmasterovaná skladba, kterou posluchači každých 15 vteřin ladí hlasováním — melodie, beat, basa, nástroj, tempo, tónina.",
};

export default async function RadioPage() {
  await guardExperiment("radio");
  const lang = await getLang();
  return <RadioApp lang={lang} />;
}
