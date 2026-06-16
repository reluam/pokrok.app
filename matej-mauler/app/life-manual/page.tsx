import { LifeManual } from "@/components/LifeManual";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Life manual — Spaghetti.ltd",
  description: "A guide to life in the style of an IKEA assembly manual — black and white, paged through left to right. Funny, instructive and true little pieces.",
  alternates: { canonical: "/life-manual" },
};

export default async function LifeManualPage() {
  await guardExperiment("life-manual");
  const lang = await getLang();
  return <LifeManual lang={lang} />;
}
