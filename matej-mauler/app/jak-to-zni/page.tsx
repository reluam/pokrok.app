import { SonifyApp } from "@/components/SonifyApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "How does it sound? — Spaghetti.ltd",
};

export default async function JakToZniPage() {
  await guardExperiment("sonify");
  const lang = await getLang();
  return <SonifyApp lang={lang} />;
}
