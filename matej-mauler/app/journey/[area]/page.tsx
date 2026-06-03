import { notFound } from "next/navigation";
import { AreaApp } from "@/components/journey/AreaApp";
import { loadAreas } from "@/lib/journey/loadAreas";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  await guardExperiment("journey");
  const { area: areaSlug } = await params;
  const lang = await getLang();
  const areas = await loadAreas();
  const area = areas.find((a) => a.slug === areaSlug);
  if (!area) notFound();
  return <AreaApp area={area} lang={lang} />;
}
