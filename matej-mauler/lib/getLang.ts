import { cookies, headers } from "next/headers";
import type { Lang } from "./dictionaries";

export const isLang = (v: unknown): v is Lang => v === "cs" || v === "en";

/**
 * Volba jazyka podle pořadí důležitosti. Čistá funkce — všechno chodí
 * parametrem, takže jde testovat bez Next runtime.
 *
 * cookie (co si uživatel zvolil) → .cz doména → geo CZ/SK → en
 */
export function pickLang(input: {
  cookie?: string | null;
  host?: string | null;
  country?: string | null;
}): Lang {
  if (isLang(input.cookie)) return input.cookie;

  // hostname bez portu; .cz musí být skutečná koncovka, ne kus názvu
  const host = (input.host ?? "").split(":")[0].toLowerCase();
  if (host.endsWith(".cz")) return "cs";

  const country = (input.country ?? "").toUpperCase();
  if (country === "CZ" || country === "SK") return "cs";

  return "en";
}

export async function getLang(): Promise<Lang> {
  const [jar, h] = await Promise.all([cookies(), headers()]);
  return pickLang({
    cookie: jar.get("lang")?.value,
    host: h.get("host"),
    country: h.get("x-vercel-ip-country") || h.get("cf-ipcountry"),
  });
}
