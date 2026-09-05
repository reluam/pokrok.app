import { AnthemApp } from "@/components/AnthemApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/hymna");

export default async function HymnaPage() {
  await guardExperiment("anthem");
  const lang = await getLang();
  return <AnthemApp lang={lang} />;
}
