import { SonifyApp } from "@/components/SonifyApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/jak-to-zni");

export default async function JakToZniPage() {
  await guardExperiment("sonify");
  const lang = await getLang();
  return <SonifyApp lang={lang} />;
}
