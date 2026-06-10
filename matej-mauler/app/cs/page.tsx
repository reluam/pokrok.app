import type { Metadata } from "next";
import { EncyclopediaShell } from "@/components/encyclopedia/Shell";
import { dictionaries } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spaghetti.ltd",
  description: dictionaries.cs.meta.description,
  alternates: {
    canonical: "/cs",
    languages: { en: "/", cs: "/cs" },
  },
};

// Brána encyklopedie — heslo nad vesmírem. Scroll dolů = do vesmíru.
export default function HomeCs() {
  return <EncyclopediaShell initialSlug="brana" lang="cs" />;
}
