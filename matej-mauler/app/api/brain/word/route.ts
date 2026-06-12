import { NextRequest, NextResponse } from "next/server";
import { brainLang, randomWord } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

// Náhodné slovo k asociování. ?not=ID → jiné než aktuální.
export async function GET(req: NextRequest) {
  try {
    const notRaw = req.nextUrl.searchParams.get("not");
    const not = notRaw ? Number(notRaw) : undefined;
    const lang = brainLang(req.nextUrl.searchParams.get("lang"));
    const word = await randomWord(lang, Number.isFinite(not) ? not : undefined);
    return NextResponse.json({ word });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
