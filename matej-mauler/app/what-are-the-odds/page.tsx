import { OddsApp } from "@/components/OddsApp";
import { getLang } from "@/lib/getLang";

export const metadata = {
  title: "What are the odds? — Spaghetti.ltd",
};

export default async function WhatAreTheOddsPage() {
  const lang = await getLang();
  return <OddsApp lang={lang} />;
}
