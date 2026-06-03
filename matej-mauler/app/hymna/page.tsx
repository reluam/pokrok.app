import { AnthemApp } from "@/components/AnthemApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hymna tvého života — Spaghetti.ltd" };

export default async function HymnaPage() {
  await guardExperiment("anthem");
  const lang = await getLang();
  return <AnthemApp lang={lang} />;
}
