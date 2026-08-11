import { cookies } from "next/headers";
import { SiteStrip } from "./SiteStrip";
import type { Lang } from "@/lib/dictionaries";
import type { Section } from "@/lib/site/sections";
import { sectionIndex } from "@/lib/site/sections";
import { getSubstackPosts } from "@/lib/substack";

/**
 * Serverový obal pásu: každá z pěti rout ho vykreslí se svým `section`, takže
 * přímý vstup i sdílený odkaz fungují normálně. Jazyk drží cookie (URL zůstávají
 * anglické v obou jazycích), texty pro oba jazyky jedou v bundlu → přepnutí je okamžité.
 */
export async function SiteShell({ section }: { section: Section["id"] }) {
  const [jar, posts] = await Promise.all([cookies(), getSubstackPosts(5)]);
  const lang: Lang = jar.get("mm_lang")?.value === "cs" ? "cs" : "en";

  return <SiteStrip initialIndex={sectionIndex(section)} initialLang={lang} posts={posts} />;
}
