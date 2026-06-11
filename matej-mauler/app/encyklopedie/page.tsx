import type { Metadata } from "next";
import { EncyclopediaShell } from "@/components/encyclopedia/Shell";
import { getLang } from "@/lib/getLang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Encyklopedie — Spaghetti.ltd",
  description: "Interaktivní encyklopedie propojená nudlemi poznání. Scrolluj z obecného do konkrétního, klikej do stran — vesmír, zvuk, hudba, Stopařův průvodce a další.",
};

// Brána encyklopedie — heslo nad vesmírem. Scroll dolů = do vesmíru.
export default async function EncyklopediePage() {
  const lang = await getLang();
  return <EncyclopediaShell initialSlug="brana" lang={lang} />;
}
