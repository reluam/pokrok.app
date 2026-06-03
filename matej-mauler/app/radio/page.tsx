import { RadioApp } from "@/components/RadioApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spaghetti Radio — Spaghetti.ltd" };

export default async function RadioPage() {
  await guardExperiment("radio");
  const lang = await getLang();
  return <RadioApp lang={lang} />;
}
