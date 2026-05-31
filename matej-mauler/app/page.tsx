import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Matěj Mauler",
  description: dictionaries.en.meta.description,
  alternates: {
    canonical: "/",
    languages: { en: "/", cs: "/cs" },
  },
};

export default function Home() {
  return <HomeContent dict={dictionaries.en} lang="en" />;
}
