import { NextResponse } from "next/server";
import { getMusicState } from "@/lib/musicServer";

export const dynamic = "force-dynamic";

/**
 * Posune kolo i bez návštěvníků. Volá Vercel Cron každou minutu.
 * getMusicState() líně vyhodnotí každé kolo po deadline (a otevře další).
 */
export async function GET() {
  try {
    const state = await getMusicState();
    return NextResponse.json({
      ok: true,
      songId: state.song.id,
      phase: state.round?.phase ?? null,
      step: state.round?.stepIndex ?? null,
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
