import { SoundFoundryApp } from "@/components/SoundFoundryApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sound Foundry — Spaghetti.ltd",
};

export default async function SoundFoundryPage() {
  await guardExperiment("foundry");
  const lang = await getLang();
  return <SoundFoundryApp lang={lang} />;
}
