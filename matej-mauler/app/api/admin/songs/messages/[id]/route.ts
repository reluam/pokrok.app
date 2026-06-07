import { NextRequest, NextResponse } from "next/server";
import { deleteMessage } from "@/lib/songsDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { id } = await params; await deleteMessage(Number(id)); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
