import { NextRequest, NextResponse } from "next/server";
import { reorderExperiments } from "@/lib/experimentsDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { order } = await req.json();
    if (!Array.isArray(order)) return NextResponse.json({ error: "order array" }, { status: 400 });
    await reorderExperiments(order as string[]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
