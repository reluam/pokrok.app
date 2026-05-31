import { cookies, headers } from "next/headers";
import type { Lang } from "./dictionaries";

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value;
  if (cookieLang === "cs" || cookieLang === "en") return cookieLang;

  const h = await headers();
  const host = h.get("host") ?? "";
  if (host.endsWith(".cz")) return "cs";

  const country =
    h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || "";
  if (country === "CZ" || country === "SK") return "cs";

  return "en";
}
