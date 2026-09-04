import { cookies } from "next/headers";
import { GlobeShell } from "./GlobeShell";
import type { Lang } from "@/lib/dictionaries";
import type { Section } from "@/lib/site/sections";
import { sectionIndex } from "@/lib/site/sections";

/**
 * Serverový obal koule: každá ze čtyř rout ho vykreslí se svým `section`, takže
 * přímý vstup i sdílený odkaz fungují normálně. Jazyk drží cookie (URL zůstávají
 * anglické v obou jazycích), texty pro oba jazyky jedou v bundlu → přepnutí je okamžité.
 */
export async function SiteShell({ section }: { section: Section["id"] }) {
  const jar = await cookies();
  const lang: Lang = jar.get("mm_lang")?.value === "cs" ? "cs" : "en";

  return <GlobeShell initialIndex={sectionIndex(section)} initialLang={lang} />;
}
