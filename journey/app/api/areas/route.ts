import { NextResponse } from "next/server";
import { loadAreas, saveAreas } from "@/lib/loadAreas";
import type { Area } from "@/lib/areas";

export const dynamic = "force-dynamic";

export async function GET() {
  const areas = await loadAreas();
  return NextResponse.json({ areas });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as { areas?: Area[] };
  if (!body?.areas) {
    return NextResponse.json({ error: "Missing areas" }, { status: 400 });
  }
  await saveAreas(body.areas);
  return NextResponse.json({ ok: true });
}
