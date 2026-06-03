import { JourneyLife } from "@/components/JourneyLife";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cesta životem — Spaghetti.ltd" };

export default async function JourneyPage() {
  await guardExperiment("journey");
  const lang = await getLang();
  return <JourneyLife lang={lang} />;
}
