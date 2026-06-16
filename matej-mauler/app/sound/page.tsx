import { SoundExperience } from "@/components/SoundExperience";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "A journey along a sound wave — Spaghetti.ltd",
  description: "An interactive sound experience: your cursor is an ear. Scroll through sound from a tremble through frequency and timbre to an echo.",
};

export default async function SoundPage() {
  await guardExperiment("sound");
  const lang = await getLang();
  return <SoundExperience lang={lang} />;
}
