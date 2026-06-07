import { NextRequest, NextResponse } from "next/server";
import { likeSong } from "@/lib/songsDb";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const b = await req.json().catch(() => ({}));
    const delta = b?.delta === -1 ? -1 : 1;
    const likes = await likeSong(slug, delta);
    return NextResponse.json({ likes });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
