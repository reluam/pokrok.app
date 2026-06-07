import { NextRequest, NextResponse } from "next/server";
import { getAllMessages } from "@/lib/songsDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getAllMessages()); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
