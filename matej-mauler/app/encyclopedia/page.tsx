import type { Metadata } from "next";
import { EncyclopediaShell } from "@/components/encyclopedia/Shell";
import { getLang } from "@/lib/getLang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Encyclopedia — Spaghetti.ltd",
  description: "An interactive encyclopedia connected by noodles of knowledge. Scroll from the general to the specific, click sideways — the universe, sound, music, the Hitchhiker's Guide and more.",
  alternates: { canonical: "/encyclopedia" },
};

// Brána encyklopedie — heslo nad vesmírem. Scroll dolů = do vesmíru.
export default async function EncyklopediePage() {
  const lang = await getLang();
  return <EncyclopediaShell initialSlug="brana" lang={lang} />;
}
