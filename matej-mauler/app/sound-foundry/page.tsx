import { SoundFoundryApp } from "@/components/SoundFoundryApp";
import { getLang } from "@/lib/getLang";

export const metadata = {
  title: "Sound Foundry — Spaghetti.ltd",
};

export default async function SoundFoundryPage() {
  const lang = await getLang();
  return <SoundFoundryApp lang={lang} />;
}
