import { SoundExperience } from "@/components/SoundExperience";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Cesta po zvukové vlně — Spaghetti.ltd",
  description: "Interaktivní zvuková experience: tvůj kurzor je ucho. Scrolluj zvukem od chvění přes frekvenci a barvu až po ozvěnu.",
};

export default async function SoundPage() {
  await guardExperiment("sound");
  const lang = await getLang();
  return <SoundExperience lang={lang} />;
}
