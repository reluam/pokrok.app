import { RadioApp } from "@/components/RadioApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/radio");

export default async function RadioPage() {
  await guardExperiment("radio");
  const lang = await getLang();
  return <RadioApp lang={lang} />;
}
