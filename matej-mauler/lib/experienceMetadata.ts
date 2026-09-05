import type { Metadata } from "next";
import type { Lang } from "./dictionaries";
import { getLang } from "./getLang";
import { experienceForPath } from "./experiencePanel";

/**
 * Metadata stránek experiencí se berou z registru v lib/experiencePanel.ts,
 * který je dvojjazyčný. Dřív každý page.tsx opisoval titulek a popis, které
 * registr už měl — tohle tu duplicitu ruší a rovnou přidá hreflang.
 */

/** Čistá část — testovatelná bez Next runtime. */
export function buildExperienceMetadata(route: string, lang: Lang): Metadata {
  const e = experienceForPath(route);
  if (!e) return { title: "Spaghetti.ltd" };
  return {
    title: `${e.title[lang]} — Spaghetti.ltd`,
    description: e.description?.[lang],
    alternates: {
      canonical: route,
      languages: {
        en: `${route}?lang=en`,
        cs: `${route}?lang=cs`,
        "x-default": route,
      },
    },
  };
}

/** Pro `export const generateMetadata = () => experienceMetadata("/sound")`. */
export async function experienceMetadata(route: string): Promise<Metadata> {
  return buildExperienceMetadata(route, await getLang());
}
