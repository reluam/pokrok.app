import { OddsApp } from "@/components/OddsApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => experienceMetadata("/what-are-the-odds");

export default async function WhatAreTheOddsPage() {
  await guardExperiment("odds");
  const lang = await getLang();
  return <OddsApp lang={lang} />;
}
