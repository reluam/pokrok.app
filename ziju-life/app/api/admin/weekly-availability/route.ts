import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getWeeklyAvailability, saveWeeklyAvailability } from "@/lib/weekly-availability-db";

const DAY_NAMES = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

export async function GET() {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await getWeeklyAvailability();
    const byDay: Record<number, { id: string; startTime: string; endTime: string; slotDurationMinutes: number }[]> = {};
    for (let d = 0; d <= 6; d++) byDay[d] = [];
    for (const r of rows) {
      byDay[r.day_of_week].push({
        id: r.id,
        startTime: r.start_time,
        endTime: r.end_time,
        slotDurationMinutes: r.slot_duration_minutes,
      });
    }
    return NextResponse.json({
      days: [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => ({
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        blocks: byDay[dayOfWeek] ?? [],
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      days: [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => ({
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        blocks: [],
      })),
    });
  }
}

export async function POST(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const blocks = Array.isArray(body.blocks) ? body.blocks : [];
    const parsed: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }[] = [];
    for (const b of blocks) {
      const dayOfWeek = Number(b.dayOfWeek ?? b.day_of_week);
      if (dayOfWeek < 0 || dayOfWeek > 6) continue;
      const startTime = String(b.startTime ?? b.start_time ?? "09:00").slice(0, 5);
      const endTime = String(b.endTime ?? b.end_time ?? "10:00").slice(0, 5);
      const slotDurationMinutes = Number(b.slotDurationMinutes ?? b.slot_duration_minutes ?? 30) || 30;
      parsed.push({ dayOfWeek, startTime, endTime, slotDurationMinutes });
    }
    await saveWeeklyAvailability(parsed);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Chyba ukládání" }, { status: 500 });
  }
}
