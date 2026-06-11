import { NextRequest, NextResponse } from "next/server";
import { adminListWords } from "@/lib/brainDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    return NextResponse.json(await adminListWords(q));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
