import { NextRequest, NextResponse } from "next/server";
import { getSong } from "@/lib/musicServer";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const song = await getSong(Number(id));
    if (!song) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(song);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
