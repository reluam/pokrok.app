import { RadioApp } from "@/components/RadioApp";
import { getLang } from "@/lib/getLang";

export const metadata = { title: "Spaghetti Radio — Spaghetti.ltd" };

export default async function RadioPage() {
  const lang = await getLang();
  return <RadioApp lang={lang} />;
}
