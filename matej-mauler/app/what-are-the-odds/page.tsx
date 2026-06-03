import { OddsApp } from "@/components/OddsApp";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "What are the odds? — Spaghetti.ltd",
};

export default async function WhatAreTheOddsPage() {
  await guardExperiment("odds");
  const lang = await getLang();
  return <OddsApp lang={lang} />;
}
