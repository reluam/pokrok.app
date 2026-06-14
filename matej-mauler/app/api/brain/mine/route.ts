import { NextRequest, NextResponse } from "next/server";
import { brainLang, getMineStats } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

// Cesta: spočítá, jak moc uživatelovy asociace sdílí dav. POST { lang, pairs: [{from, to}] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const lang = brainLang(body?.lang);
    const pairs = Array.isArray(body?.pairs) ? body.pairs : [];
    return NextResponse.json({ items: await getMineStats(lang, pairs) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
