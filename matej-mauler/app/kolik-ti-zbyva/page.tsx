import { QuestionFlow } from "@/components/QuestionFlow";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Kolik ti zbývá? — Spaghetti.ltd",
};

export default async function KolikTiZbyvaPage() {
  await guardExperiment("cas");
  const lang = await getLang();
  return <QuestionFlow lang={lang} />;
}
