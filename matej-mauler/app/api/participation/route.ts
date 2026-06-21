import { NextRequest, NextResponse } from "next/server";
import { ensureAnonSession, recordParticipation } from "@/lib/accountsDb";
import { resolveParticipationActor } from "@/lib/account/session";
import { evaluateRewards } from "@/lib/rewards/evaluate";

export const dynamic = "force-dynamic";

// Records a completed experience (anonymous OR signed-in) and, for signed-in users, evaluates
// rewards. Anonymous participations are stored against the sp_anon session and get their badges
// when the user later registers (merge-on-auth). Never gates the core experience.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const experimentSlug = typeof b?.experimentSlug === "string" ? b.experimentSlug : "";
    if (!experimentSlug) return NextResponse.json({ error: "missing experimentSlug" }, { status: 400 });
    const payload = b?.payload ?? null;
    const insight = b?.insight ?? null;

    const { userId, sessionId } = await resolveParticipationActor();
    if (!userId && sessionId) await ensureAnonSession(sessionId);

    await recordParticipation({ experimentSlug, userId, sessionId, payload, insight });

    const awarded = userId
      ? await evaluateRewards({ userId, experimentSlug, participation: { experimentSlug, payload, insight } })
      : [];

    return NextResponse.json({ ok: true, signedIn: !!userId, awarded });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
