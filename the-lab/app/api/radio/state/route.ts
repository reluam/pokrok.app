import { NextResponse } from "next/server";
import { getSharedState } from "@/lib/radioServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getSharedState());
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
