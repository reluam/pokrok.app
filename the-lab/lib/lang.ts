import { cookies, headers } from "next/headers";

export type Lang = "cs" | "en";

export async function getLang(): Promise<Lang> {
  try {
    const c = await cookies();
    const v = c.get("lang")?.value;
    if (v === "cs" || v === "en") return v;
    const h = await headers();
    const country = h.get("x-vercel-ip-country") || "";
    if (country === "CZ" || country === "SK") return "cs";
    if ((h.get("accept-language") ?? "").startsWith("cs")) return "cs";
  } catch {}
  return "en";
}
