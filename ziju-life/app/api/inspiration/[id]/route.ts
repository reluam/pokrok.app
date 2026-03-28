import { NextRequest, NextResponse } from "next/server";
import { getInspirationData } from "@/lib/inspiration-db";
import { getToolCardsWithDates } from "@/lib/toolbox-db";
import { toolToInspirationItem } from "@/lib/inspiration";

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
    // Search in inspirations
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

    let item = allItems.find((i) => i.id === id);

    // If not found, search in toolbox tools (tools have IDs like #tool_slug)
    if (!item) {
      try {
        const toolCards = await getToolCardsWithDates();
        const toolItems = toolCards.map(toolToInspirationItem);
        item = toolItems.find((i) => i.id === id);
      } catch {}
    }

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("GET /api/inspiration/[id] error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
