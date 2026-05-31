import { NextResponse } from "next/server";
import { getMusicState } from "@/lib/musicServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getMusicState();
    return NextResponse.json(state);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
