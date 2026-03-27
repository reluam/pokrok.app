import { NextRequest, NextResponse } from "next/server";
import { getToolBySlug } from "@/lib/toolbox-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { error: "Chybí slug nástroje." },
        { status: 400 }
      );
    }

    const tool = await getToolBySlug(slug);
    if (!tool || !tool.isActive) {
      return NextResponse.json(
        { error: "Nástroj nebyl nalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json({ tool });
  } catch (error) {
    console.error("GET /api/laborator/toolbox/[slug] error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst nástroj." },
      { status: 500 }
    );
  }
}
