import { AreaApp } from "@/components/journey/AreaApp";
import { loadAreas } from "@/lib/journey/loadAreas";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";

export default async function Page() {
  await guardExperiment("journey");
  const lang = await getLang();
  const areas = await loadAreas();
  const introArea = areas.find((a) => a.slug === "intro") ?? areas[0];
  return <AreaApp area={introArea} lang={lang} />;
}
