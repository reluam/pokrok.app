import { SoundUniverse } from "@/components/SoundUniverse";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sound Universe — Spaghetti.ltd" };

export default async function SoundUniversePage() {
  await guardExperiment("soundverse");
  const lang = await getLang();
  return <SoundUniverse lang={lang} />;
}
