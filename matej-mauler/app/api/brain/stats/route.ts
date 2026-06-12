import { NextRequest, NextResponse } from "next/server";
import { brainLang, getBrainStats } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await getBrainStats(brainLang(req.nextUrl.searchParams.get("lang"))));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
