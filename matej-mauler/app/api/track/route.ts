import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/metricsDb";

export const dynamic = "force-dynamic";

const SLUGS = new Set(["encyklopedie", "sound", "music", "radio", "brain"]);

// +1 otevření / interakce projektu. Klient dedupuje per session, tady jen validace a zápis.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const slug = String(b.slug ?? "");
    const kind = b.kind === "interact" ? "interact" : b.kind === "open" ? "open" : null;
    if (!SLUGS.has(slug) || !kind) return NextResponse.json({ ok: false }, { status: 400 });
    await trackEvent(slug, kind);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
