import { NextRequest, NextResponse } from "next/server";
import { isAdminReq } from "@/lib/adminAuth";
import { setTexts } from "@/lib/siteTextsDb";
import type { Lang } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

// Uloží overridy textů hlavní stránky. Prázdná hodnota = vrátit default ze slovníku.
export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const items = (Array.isArray(b.items) ? b.items : []).map((it: { key?: unknown; lang?: unknown; value?: unknown }) => ({
      key: String(it.key ?? ""),
      lang: (it.lang === "en" ? "en" : "cs") as Lang,
      value: it.value == null ? null : String(it.value),
    }));
    await setTexts(items);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
