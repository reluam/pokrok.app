import { LifeManual } from "@/components/LifeManual";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Life Manual — Spaghetti.ltd",
  description: "A guide to life in the style of an IKEA assembly manual — black and white technical sheets. Funny, instructive and true little pieces.",
  alternates: { canonical: "/life-manual" },
};

export default async function LifeManualPage() {
  await guardExperiment("life-manual");
  return <LifeManual />;
}
