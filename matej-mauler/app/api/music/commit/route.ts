import { NextRequest, NextResponse } from "next/server";
import { commitChoice } from "@/lib/musicServer";
import type { Phase } from "@/lib/music";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { songId, phase, stepIndex, optionId } = await req.json();
    if (typeof songId !== "number" || typeof phase !== "string" || typeof stepIndex !== "number" || typeof optionId !== "string") {
      return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
    }
    const state = await commitChoice(songId, phase as Phase, stepIndex, optionId);
    return NextResponse.json(state);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
