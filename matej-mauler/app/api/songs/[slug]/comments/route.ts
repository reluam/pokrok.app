import { NextRequest, NextResponse } from "next/server";
import { listComments, addComment } from "@/lib/songsDb";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return NextResponse.json(await listComments(slug));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const b = await req.json().catch(() => ({}));
    const content = String(b?.content || "");
    const author = String(b?.author || "");
    if (!content.trim()) return NextResponse.json({ error: "Prázdný komentář" }, { status: 400 });
    const comment = await addComment(slug, author, content);
    if (!comment) return NextResponse.json({ error: "Nelze přidat" }, { status: 400 });
    return NextResponse.json(comment);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
