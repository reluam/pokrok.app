import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AreaApp } from "@/components/AreaApp";
import { loadAreas } from "@/lib/loadAreas";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ area: string }>;
};

export default async function AreaPage({ params }: Props) {
  const { area: areaSlug } = await params;
  const hdrs = await headers();
  const lang = (hdrs.get("x-lang") as Lang) ?? "en";
  const areas = await loadAreas();
  const area = areas.find(a => a.slug === areaSlug);
  if (!area) notFound();
  return <AreaApp area={area} lang={lang} />;
}
