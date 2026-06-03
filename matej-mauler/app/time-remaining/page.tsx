import { QuestionFlow } from "@/components/QuestionFlow";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Time Remaining — Spaghetti.ltd",
};

export default async function TimeRemainingPage() {
  await guardExperiment("cas");
  const lang = await getLang();
  return <QuestionFlow lang={lang} />;
}
