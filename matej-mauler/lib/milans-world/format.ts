import type { Lang } from "@/lib/dictionaries";
import { FX, SCALES, TIMES, UI } from "./copy";
import { NBSP, dec, grp } from "./numbers";

/**
 * Formátování čísel, peněz a času. Všechno bere jazyk parametrem — původní hra
 * si ho brala z globální proměnné LANG, tady se musí předat, aby to šlo testovat
 * a aby dva jazyky nemohly nikdy zamíchat oddělovače.
 */

const t = (lang: Lang, k: "infinity" | "queue" | "currency" | "nothingYet") => UI[lang][k];

/** Velká čísla pojmenovaně: čeština dlouhé měřítko (bilion = 10^12), angličtina krátké. */
export function fmt(n: number, lang: Lang): string {
  if (!isFinite(n)) return t(lang, "infinity");
  if (n < 0) return "0";
  if (n < 1000) return n < 10 && n % 1 !== 0 ? dec(n, 1, lang) : grp(Math.floor(n), lang);
  if (n < 1e6) return grp(Math.floor(n), lang);
  const sc = SCALES[lang];
  for (let i = sc.length - 1; i >= 0; i--) {
    if (n >= sc[i][0]) {
      const v = n / sc[i][0];
      return dec(v, v < 10 ? 2 : 1, lang) + NBSP + sc[i][1];
    }
  }
  return n.toExponential(2).replace(".", lang === "cs" ? "," : ".");
}

/** Peníze se interně drží v korunách; angličtina je přepočítá na dolary. */
export function moneyNum(n: number, lang: Lang): string {
  const v = n / FX[lang];
  if (lang === "en" && v < 100) return dec(v, 2, lang);
  return fmt(v, lang);
}

export const fmtMoney = (n: number, lang: Lang) => moneyNum(n, lang) + NBSP + t(lang, "currency");

/** „≈ 3,4 roku ve frontě" — minuty přeložené na lidskou jednotku. */
export function humanTime(min: number, lang: Lang): string {
  if (min < 1) return t(lang, "nothingYet");
  const arr = TIMES[lang];
  let u = arr[0];
  for (const row of arr) if (min >= row[0]) u = row;
  const v = min / u[0];
  const s = v >= 1e6 ? fmt(v, lang) : dec(v, v < 100 ? 1 : 0, lang);
  const last = u === arr[arr.length - 1];
  return "≈ " + s + NBSP + u[1] + (last ? "" : t(lang, "queue"));
}

export function hoursMins(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return (h ? h + " h " : "") + m + " min";
}
