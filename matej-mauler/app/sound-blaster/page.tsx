import { SoundBlasterBook } from "@/components/SoundBlasterBook";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sound Blaster — Spaghetti.ltd" };

export default async function SoundBlasterPage() {
  await guardExperiment("soundverse");
  const lang = await getLang();
  return <SoundBlasterBook lang={lang} />;
}
