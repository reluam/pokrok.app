import { AnthemApp } from "@/components/AnthemApp";
import { getLang } from "@/lib/getLang";

export const metadata = { title: "Hymna tvého života — Spaghetti.ltd" };

export default async function HymnaPage() {
  const lang = await getLang();
  return <AnthemApp lang={lang} />;
}
