import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Matěj Mauler",
  description: dictionaries.cs.meta.description,
  alternates: {
    canonical: "/cs",
    languages: { en: "/", cs: "/cs" },
  },
};

export default function HomeCs() {
  return <HomeContent dict={dictionaries.cs} lang="cs" />;
}
