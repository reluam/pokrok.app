import { RadioApp } from "@/components/RadioApp";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rádio — The Lab",
  description: "Společné internetové rádio: nekonečná generovaná skladba, kterou návštěvníci ladí hlasováním o jednotlivých buňkách.",
};

export default async function RadioPage() {
  const lang = await getLang();
  return <RadioApp lang={lang} />;
}
