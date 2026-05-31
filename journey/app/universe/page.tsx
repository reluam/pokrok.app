import { headers } from "next/headers";
import { UniverseView } from "@/components/UniverseView";
import { loadAreas } from "@/lib/loadAreas";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function UniversePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const hdrs = await headers();
  const lang = (hdrs.get("x-lang") as Lang) ?? "en";
  const areas = await loadAreas();
  const { from } = await searchParams;
  return <UniverseView areas={areas} lang={lang} focusSlug={from} />;
}
