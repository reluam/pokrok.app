import { AboutMap } from "@/components/AboutMap";
import { getLang } from "@/lib/getLang";
import { guardExperiment, getPublicExperiments } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "The Spaghetti map — Spaghetti.ltd",
  description: "A map of how Spaghetti.ltd connects: projects as nodes, concepts as shared noodles. Why each experiment came to be and how it works.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  await guardExperiment("about");
  const lang = await getLang();
  // jen publikované projekty (drafty jako rádio / decision-maker se nezobrazí)
  const published = (await getPublicExperiments(lang).catch(() => [])).map((e) => e.slug);
  return <AboutMap lang={lang} published={published} />;
}
