import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser, getWeekStart, getLastSunday } from "@/lib/laborator-user";
import { sql } from "@/lib/database";

export const dynamic = "force-dynamic";

// ── GET /api/laborator/checkin ─────────────────────────────────────────────────
// Returns last 12 weeks of check-ins (with value_scores + area_scores).

export async function GET(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ checkins: [], thisWeekDone: false });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT score, week_start_date, value_scores, area_scores
    FROM weekly_checkins
    WHERE user_id = ${user.id}
    ORDER BY week_start_date DESC
    LIMIT 12
  ` as { score: number | null; week_start_date: string; value_scores: Record<string, number> | null; area_scores: Record<string, number> | null }[];

  const thisWeek = getWeekStart();
  const thisWeekDone = rows.some((r) => r.week_start_date.startsWith(thisWeek));

  // Reflection is due if no checkin was created since last Sunday midnight (UTC)
  const lastSunday = getLastSunday();
  const reflectionRows = await sql`
    SELECT 1 FROM weekly_checkins
    WHERE user_id = ${user.id}
      AND created_at >= ${lastSunday + "T00:00:00Z"}::timestamptz
    LIMIT 1
  ` as unknown[];
  const reflectionDone = reflectionRows.length > 0;

  return NextResponse.json({
    checkins: rows.reverse(), // oldest first for charts
    thisWeekDone,
    thisWeek,
    reflectionDone,
  });
}

// ── POST /api/laborator/checkin ────────────────────────────────────────────────
// Saves (or upserts) a check-in with value_scores and area_scores.

export async function POST(req: NextRequest) {
  const user = await getLaboratorUser(req);
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const valueScores: Record<string, number> = body.valueScores ?? {};
  const areaScores: Record<string, number> = body.areaScores ?? {};

  if (Object.keys(areaScores).length === 0) {
    return NextResponse.json({ error: "areaScores required" }, { status: 400 });
  }

  // Compute summary score as average of area scores
  const areaVals = Object.values(areaScores);
  const avgScore = Math.round(areaVals.reduce((a, b) => a + b, 0) / areaVals.length);

  const weekStart = getWeekStart();
  const id = `wc_${user.id}_${weekStart}`;

  await sql`
    INSERT INTO weekly_checkins (id, user_id, score, week_start_date, value_scores, area_scores, created_at)
    VALUES (${id}, ${user.id}, ${avgScore}, ${weekStart}, ${JSON.stringify(valueScores)}, ${JSON.stringify(areaScores)}, NOW())
    ON CONFLICT (user_id, week_start_date) DO UPDATE
      SET score = EXCLUDED.score,
          value_scores = EXCLUDED.value_scores,
          area_scores = EXCLUDED.area_scores,
          created_at = NOW()
  `;

  return NextResponse.json({ ok: true, week: weekStart, avgScore });
}
