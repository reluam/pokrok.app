import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Matěj Mauler",
  description: dictionaries.cs.meta.description,
  alternates: {
    canonical: "/",
    languages: { cs: "/", en: "/en" },
  },
};

export default function Home() {
  return <HomeContent dict={dictionaries.cs} lang="cs" />;
}
