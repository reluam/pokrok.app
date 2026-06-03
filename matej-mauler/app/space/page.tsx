import { SpaceView } from "@/components/SpaceView";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Space — Spaghetti.ltd" };

export default async function SpacePage() {
  await guardExperiment("space");
  const lang = await getLang();
  return <SpaceView lang={lang} />;
}
