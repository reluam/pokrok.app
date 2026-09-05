import { MilansWorld } from "@/components/milans-world/MilansWorld";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import "./milans-world.css";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const generateMetadata = () => experienceMetadata("/milans-world");

export default async function Page() {
  await guardExperiment("milans-world");
  const lang = await getLang();
  // Fonty (--msw-*) deklaruje root layout, aby je viděl i ExperiencePanel.
  return <MilansWorld initialLang={lang} />;
}
