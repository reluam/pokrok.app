import { LifeManual } from "@/components/LifeManual";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Manuál na život — Spaghetti.ltd",
  description: "Návod na život ve stylu IKEA montážního manuálu — černobíle, listuje se zleva doprava. Vtipné, naučné a pravdivé střípky.",
  alternates: { canonical: "/life-manual" },
};

export default async function LifeManualPage() {
  await guardExperiment("life-manual");
  const lang = await getLang();
  return <LifeManual lang={lang} />;
}
