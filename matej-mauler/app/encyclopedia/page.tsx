import type { Metadata } from "next";
import { EncyclopediaShell } from "@/components/encyclopedia/Shell";
import { getLang } from "@/lib/getLang";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = () => experienceMetadata("/encyclopedia");

// Brána encyklopedie — heslo nad vesmírem. Scroll dolů = do vesmíru.
export default async function EncyklopediePage() {
  const lang = await getLang();
  return <EncyclopediaShell initialSlug="brana" lang={lang} />;
}
