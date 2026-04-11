import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { dictionaries } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: dictionaries.en.meta.title,
  description: dictionaries.en.meta.description,
  alternates: {
    canonical: "/en",
    languages: {
      cs: "/",
      en: "/en",
    },
  },
};

export default function HomeEn() {
  return <HomeContent dict={dictionaries.en} lang="en" />;
}
