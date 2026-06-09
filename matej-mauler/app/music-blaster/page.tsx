import { MusicBlasterBook } from "@/components/MusicBlasterBook";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jak vzniká hudba — Spaghetti.ltd" };

export default async function MusicBlasterPage() {
  await guardExperiment("musicblaster");
  const lang = await getLang();
  return <MusicBlasterBook lang={lang} />;
}
