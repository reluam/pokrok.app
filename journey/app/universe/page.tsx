import { headers } from "next/headers";
import { UniverseView } from "@/components/UniverseView";
import { loadAreas } from "@/lib/loadAreas";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function UniversePage() {
  const hdrs = await headers();
  const lang = (hdrs.get("x-lang") as Lang) ?? "en";
  const areas = loadAreas();
  return <UniverseView areas={areas} lang={lang} />;
}
