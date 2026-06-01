import { MusicMakerApp } from "@/components/MusicMakerApp";
import { getLang } from "@/lib/getLang";

export const metadata = { title: "Skládačka hudby — Spaghetti.ltd" };

export default async function MusicPage() {
  const lang = await getLang();
  // Žádné DB volání při SSR → stránka se zobrazí okamžitě.
  // Hotové songy se načtou na klientovi (a Neon se případně probudí na pozadí).
  return <MusicMakerApp lang={lang} finished={[]} />;
}
