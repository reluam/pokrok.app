import { NextRequest, NextResponse } from "next/server";
import { brainLang, getBrainMap } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

// Mapa sítě pro Researchera: slova + synapse se silou (count). ?lang=cs|en — každý jazyk má vlastní síť.
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await getBrainMap(brainLang(req.nextUrl.searchParams.get("lang"))));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
