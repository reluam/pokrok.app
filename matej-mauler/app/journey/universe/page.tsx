import { UniverseView } from "@/components/journey/UniverseView";
import { loadAreas } from "@/lib/journey/loadAreas";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";

export default async function UniversePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await guardExperiment("journey");
  const lang = await getLang();
  const areas = await loadAreas();
  const { from } = await searchParams;
  return <UniverseView areas={areas} lang={lang} focusSlug={from} />;
}
