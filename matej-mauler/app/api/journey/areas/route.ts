import { NextRequest, NextResponse } from "next/server";
import { loadAreas, saveAreas } from "@/lib/journey/loadAreas";
import { isAdminReq } from "@/lib/adminAuth";
import type { Area } from "@/lib/journey/areas";

export const dynamic = "force-dynamic";

export async function GET() {
  const areas = await loadAreas();
  return NextResponse.json({ areas });
}

export async function PUT(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { areas?: Area[] };
  if (!body?.areas) return NextResponse.json({ error: "Missing areas" }, { status: 400 });
  await saveAreas(body.areas);
  return NextResponse.json({ ok: true });
}
