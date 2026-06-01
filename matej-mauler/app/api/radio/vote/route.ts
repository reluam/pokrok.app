import { NextRequest, NextResponse } from "next/server";
import { voteCell } from "@/lib/radioServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function ipHash(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip + "radio").digest("hex").slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const { roundNo, cell } = await req.json();
    if (typeof roundNo !== "number" || typeof cell !== "string" || cell.length > 40) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    return NextResponse.json(await voteCell(roundNo, cell, ipHash(req)));
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
