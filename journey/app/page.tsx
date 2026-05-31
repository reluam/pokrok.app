import { headers } from "next/headers";
import { AreaApp } from "@/components/AreaApp";
import { loadAreas } from "@/lib/loadAreas";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Page() {
  const hdrs = await headers();
  const lang = (hdrs.get("x-lang") as Lang) ?? "en";
  const areas = await loadAreas();
  // Root page shows the intro area (order=0)
  const introArea = areas.find(a => a.slug === "intro") ?? areas[0];
  return <AreaApp area={introArea} lang={lang} />;
}
