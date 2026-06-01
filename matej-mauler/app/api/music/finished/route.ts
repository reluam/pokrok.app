import { NextResponse } from "next/server";
import { getFinishedSongs } from "@/lib/musicServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getFinishedSongs());
  } catch {
    return NextResponse.json([]);
  }
}
