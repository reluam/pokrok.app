import { MusicMakerApp } from "@/components/MusicMakerApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Skládačka hudby — Spaghetti.ltd" };

export default async function MusicPage() {
  await guardExperiment("musicvote");
  const lang = await getLang();
  // Žádné DB volání při SSR → stránka se zobrazí okamžitě.
  // Hotové songy se načtou na klientovi (a Neon se případně probudí na pozadí).
  return <MusicMakerApp lang={lang} finished={[]} />;
}
