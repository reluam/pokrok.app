import { QuestionFlow } from "@/components/QuestionFlow";
import { getLang } from "@/lib/getLang";

export const metadata = {
  title: "Kolik ti zbývá? — Spaghetti.ltd",
};

export default async function KolikTiZbyvaPage() {
  const lang = await getLang();
  return <QuestionFlow lang={lang} />;
}
