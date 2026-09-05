import { QuestionFlow } from "@/components/QuestionFlow";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/time-remaining");

export default async function TimeRemainingPage() {
  await guardExperiment("cas");
  const lang = await getLang();
  return <QuestionFlow lang={lang} />;
}
