import { NextRequest, NextResponse } from "next/server";
import { getToolCards } from "@/lib/toolbox-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const category = sp.get("category") || undefined;
    const tag = sp.get("tag") || undefined;
    const search = sp.get("q") || undefined;
    const limit = Math.min(Math.max(Number(sp.get("limit")) || 24, 1), 100);
    const offset = Math.max(Number(sp.get("offset")) || 0, 0);

    const { tools, total } = await getToolCards({ category, tag, search, limit, offset });
    return NextResponse.json({ tools, total });
  } catch (error) {
    console.error("GET /api/laborator/toolbox error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst nástroje." },
      { status: 500 }
    );
  }
}
