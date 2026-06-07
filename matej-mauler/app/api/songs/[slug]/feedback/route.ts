import { NextRequest, NextResponse } from "next/server";
import { addMessage } from "@/lib/songsDb";

export const dynamic = "force-dynamic";

// Soukromá zpráva autorovi — jen zápis, nic se veřejně nečte.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const b = await req.json().catch(() => ({}));
    const content = String(b?.content || "");
    const author = String(b?.author || "");
    if (!content.trim()) return NextResponse.json({ error: "Prázdná zpráva" }, { status: 400 });
    const ok = await addMessage(slug, author, content);
    if (!ok) return NextResponse.json({ error: "Nelze odeslat" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
