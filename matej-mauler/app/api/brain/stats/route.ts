import { NextResponse } from "next/server";
import { getBrainStats } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getBrainStats());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
