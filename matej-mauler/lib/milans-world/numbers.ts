import type { Lang } from "@/lib/dictionaries";

/** Oddělovače a základní formátování čísel. Bez závislostí, aby copy.ts i
 *  format.ts mohly stavět na tomhle a netočily se dokola. */
export const NBSP = "\u00a0";

export const grpSep = (lang: Lang) => (lang === "cs" ? NBSP : ",");
export const decSep = (lang: Lang) => (lang === "cs" ? "," : ".");

/** Tisíce po trojicích. */
export const grp = (n: number | string, lang: Lang) =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, grpSep(lang));

/** Desetinná čísla s jazykovým oddělovačem. */
export const dec = (x: number, d: number, lang: Lang) => x.toFixed(d).replace(".", decSep(lang));
