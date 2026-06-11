import { NextResponse } from "next/server";
import { getBrainMap } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

// Mapa mozku pro Researchera: slova + synapse se silou (count).
export async function GET() {
  try {
    return NextResponse.json(await getBrainMap());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
