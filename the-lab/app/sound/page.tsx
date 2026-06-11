import { SoundExperience } from "@/components/SoundExperience";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Cesta po zvukové vlně — The Lab",
  description: "Interaktivní zvuková experience: tvůj kurzor je ucho. Scrolluj zvukem od chvění přes frekvenci a barvu až po ozvěnu.",
};

export default async function SoundPage() {
  const lang = await getLang();
  return <SoundExperience lang={lang} />;
}
