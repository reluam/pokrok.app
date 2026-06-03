import { notFound } from "next/navigation";
import { AreaApp } from "@/components/journey/AreaApp";
import { loadAreas } from "@/lib/journey/loadAreas";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";

export default async function ChapterPage({ params }: { params: Promise<{ area: string; chapter: string }> }) {
  await guardExperiment("journey");
  const { area: areaSlug, chapter: chapterSlug } = await params;
  const lang = await getLang();
  const areas = await loadAreas();
  const area = areas.find((a) => a.slug === areaSlug);
  if (!area) notFound();
  const chapter = area.chapters.find((ch) => ch.slug === chapterSlug);
  if (!chapter) notFound();
  return <AreaApp area={area} lang={lang} initialChapterSlug={chapterSlug} />;
}
