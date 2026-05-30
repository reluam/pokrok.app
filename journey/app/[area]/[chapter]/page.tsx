import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AreaApp } from "@/components/AreaApp";
import { loadAreas } from "@/lib/loadAreas";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ area: string; chapter: string }>;
};

export default async function ChapterPage({ params }: Props) {
  const { area: areaSlug, chapter: chapterSlug } = await params;
  const hdrs = await headers();
  const lang = (hdrs.get("x-lang") as Lang) ?? "en";
  const areas = loadAreas();
  const area = areas.find(a => a.slug === areaSlug);
  if (!area) notFound();
  const chapter = area.chapters.find(ch => ch.slug === chapterSlug);
  if (!chapter) notFound();
  return <AreaApp area={area} lang={lang} initialChapterSlug={chapterSlug} />;
}
