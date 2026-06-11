import { NextRequest, NextResponse } from "next/server";
import { adminDeleteWord } from "@/lib/brainDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const n = Number(id);
    if (!Number.isInteger(n)) return NextResponse.json({ error: "bad id" }, { status: 400 });
    await adminDeleteWord(n);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
