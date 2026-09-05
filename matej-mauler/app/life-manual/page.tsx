import { LifeManual } from "@/components/LifeManual";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/life-manual");

export default async function LifeManualPage() {
  await guardExperiment("life-manual");
  return <LifeManual />;
}
