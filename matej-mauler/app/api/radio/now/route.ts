import { NextResponse } from "next/server";
import { getNow } from "@/lib/radioServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getNow(), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "db" }, { status: 500 });
  }
}
