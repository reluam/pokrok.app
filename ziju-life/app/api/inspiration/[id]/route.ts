import { NextRequest, NextResponse } from "next/server";
import { getInspirationData } from "@/lib/inspiration-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const data = await getInspirationData(false);
    const allItems = [
      ...data.blogs,
      ...data.videos,
      ...data.books,
      ...data.articles,
      ...data.other,
      ...data.music,
      ...data.reels,
      ...data.princips,
    ];

    const item = allItems.find((i) => i.id === id);

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("GET /api/inspiration/[id] error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
