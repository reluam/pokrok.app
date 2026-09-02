import type { Bi } from "@/lib/about";

/**
 * „Nad čím přemýšlím" — nápady, které nedělám a myslím si, že by měly
 * existovat. Není to seznam projektů: tohle jsou věci k rozebrání. Kdo si
 * jeden vezme, dobře udělá.
 *
 * VŠECHNY TŘI POLOŽKY JSOU PLACEHOLDER — Matěj je přepíše. Test
 * „v datech nezůstal PLACEHOLDER" (lib/site/ideas.test.ts) padá, dokud tu
 * to slovo zůstává. To je záměr, ne rozbitý build.
 *
 * Hlas: sentence case, první osoba, žádná pointa na konci odstavce,
 * max 2–3 věty na blok (viz docs/superpowers/specs/2026-08-12-osobni-web-texty-design.md).
 */

export type Idea = {
  id: string;
  title: Bi;
  /** Jedna věta: co to je. */
  what: Bi;
  /** Odstavec: proč si myslím, že by to mělo existovat. */
  why: Bi;
  /** Volitelně: co by na tom bylo těžké. Bez tohohle je to jen přání. */
  hard?: Bi;
};

export const IDEAS: Idea[] = [
  {
    id: "napad-1",
    title: {
      cs: "PLACEHOLDER — název prvního nápadu",
      en: "PLACEHOLDER — first idea's name",
    },
    what: {
      cs: "PLACEHOLDER — jedna věta, co to je. Konkrétně, ne kategorie.",
      en: "PLACEHOLDER — one sentence on what it is. Concrete, not a category.",
    },
    why: {
      cs: "PLACEHOLDER — odstavec o tom, proč si myslím, že by to mělo existovat. Co dneska chybí a komu.",
      en: "PLACEHOLDER — a paragraph on why I think it should exist. What's missing today, and for whom.",
    },
    hard: {
      cs: "PLACEHOLDER — co by na tom bylo těžké. Volitelné, ale bez toho je to jen přání.",
      en: "PLACEHOLDER — what would be hard about it. Optional, but without it it's just a wish.",
    },
  },
  {
    id: "napad-2",
    title: { cs: "PLACEHOLDER — název druhého nápadu", en: "PLACEHOLDER — second idea's name" },
    what: {
      cs: "PLACEHOLDER — jedna věta, co to je. Konkrétně, ne kategorie.",
      en: "PLACEHOLDER — one sentence on what it is. Concrete, not a category.",
    },
    why: {
      cs: "PLACEHOLDER — odstavec o tom, proč si myslím, že by to mělo existovat. Co dneska chybí a komu.",
      en: "PLACEHOLDER — a paragraph on why I think it should exist. What's missing today, and for whom.",
    },
  },
  {
    id: "napad-3",
    title: { cs: "PLACEHOLDER — název třetího nápadu", en: "PLACEHOLDER — third idea's name" },
    what: {
      cs: "PLACEHOLDER — jedna věta, co to je. Konkrétně, ne kategorie.",
      en: "PLACEHOLDER — one sentence on what it is. Concrete, not a category.",
    },
    why: {
      cs: "PLACEHOLDER — odstavec o tom, proč si myslím, že by to mělo existovat. Co dneska chybí a komu.",
      en: "PLACEHOLDER — a paragraph on why I think it should exist. What's missing today, and for whom.",
    },
  },
];
