import { NextRequest, NextResponse } from "next/server";
import { brainLang, randomWord } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

// Náhodné slovo k asociování. ?lang, ?not=ID (nezopakovat aktuální), ?seen=1,2,3 (už viděná → vyloučit).
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const lang = brainLang(sp.get("lang"));
    const seen = (sp.get("seen") ?? "").split(",").map(Number).filter(Number.isInteger);
    const notRaw = sp.get("not");
    const not = notRaw ? Number(notRaw) : undefined;
    const avoid = not !== undefined && Number.isFinite(not) ? not : undefined;
    const word = await randomWord(lang, seen, avoid);
    return NextResponse.json({ word });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
