import { AboutMap } from "@/components/AboutMap";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mapa Spaghetti — Spaghetti.ltd",
  description: "Mapa toho, jak Spaghetti.ltd souvisí: projekty jako nody, koncepty jako sdílené nudle. Proč jednotlivé experimenty vznikly a jak fungují.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  await guardExperiment("about");
  const lang = await getLang();
  return <AboutMap lang={lang} />;
}
