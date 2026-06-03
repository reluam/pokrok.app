import { NextRequest, NextResponse } from "next/server";
import { patchExperiment, deleteExperiment } from "@/lib/experimentsDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { slug } = await params;
    const b = await req.json();
    await patchExperiment(slug, b);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { slug } = await params; await deleteExperiment(slug); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
