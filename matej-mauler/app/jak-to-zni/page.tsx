import { SonifyApp } from "@/components/SonifyApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jak to zní? — Spaghetti.ltd",
};

export default async function JakToZniPage() {
  await guardExperiment("sonify");
  const lang = await getLang();
  return <SonifyApp lang={lang} />;
}
