import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { sql, ensureCoreTables } from "@/lib/database";

export const dynamic = "force-dynamic";

/** Get date in Europe/Prague timezone as YYYY-MM-DD */
function getLocalDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Handle both properly stored JSONB and double-encoded strings */
function parseTodos(val: unknown): { text: string; done: boolean }[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; } catch {}
  }
  return [];
}

/**
 * Batched dashboard endpoint — returns todos, user context, and ritual completions
 * in a single request with a single auth check.
 */
export async function GET(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCoreTables();
    const today = getLocalDate();
    const yesterday = getLocalDate(-1);
    const thirtyDaysAgo = getLocalDate(-30);

    // Run all queries in parallel (catch individually so one failure doesn't block all)
    const [todoRows, contextRows, completionRows, statsRows] = await Promise.all([
      sql`
        SELECT date, todos, nice_todos FROM daily_todos
        WHERE user_id = ${user.id} AND date IN (${today}, ${yesterday})
        ORDER BY date DESC
      `.catch(() => [] as { date: string; todos: unknown; nice_todos: unknown }[]),
      sql`
        SELECT context_type, data FROM user_lab_context
        WHERE user_id = ${user.id}
      `.catch(() => [] as { context_type: string; data: unknown }[]),
      sql`
        SELECT ritual_id FROM ritual_completions
        WHERE user_id = ${user.id} AND date = ${today}
      `.catch(() => [] as { ritual_id: string }[]),
      sql`
        SELECT ritual_id, COUNT(*)::int AS count FROM ritual_completions
        WHERE user_id = ${user.id} AND date >= ${thirtyDaysAgo}
        GROUP BY ritual_id
      `.catch(() => [] as { ritual_id: string; count: number }[]),
    ]);

    // DB returns Date objects — convert for comparison
    const toDateStr = (d: unknown): string => {
      if (d instanceof Date) return d.toISOString().split("T")[0];
      const s = String(d);
      if (s.includes("T")) return s.split("T")[0];
      try { return new Date(s).toISOString().split("T")[0]; } catch {}
      return s;
    };
    const todayData = (todoRows as { date: unknown; todos: unknown; nice_todos: unknown }[])
      .find((r) => toDateStr(r.date) === today);
    const yesterdayData = (todoRows as { date: unknown; todos: unknown; nice_todos: unknown }[])
      .find((r) => toDateStr(r.date) === yesterday);

    // Compose context + mark overdue priorities
    const context: Record<string, unknown> = {};
    for (const row of contextRows as { context_type: string; data: unknown }[]) {
      context[row.context_type] = row.data;
    }

    // Mark overdue priorities: unsolved items from previous periods
    if (context.priorities && typeof context.priorities === "object") {
      const p = context.priorities as {
        weekly?: { text: string; done: boolean; overdue?: boolean; addedAt?: string }[];
        monthly?: { text: string; done: boolean; overdue?: boolean; addedAt?: string }[];
        yearly?: { text: string; done: boolean; overdue?: boolean; addedAt?: string }[];
        _lastWeekStart?: string;
        _lastMonthStart?: string;
        _lastYearStart?: string;
      };

      const now = new Date(Date.now());
      // Current week start (Monday)
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisWeekStart = getLocalDate(mondayOffset);
      // Current month start
      const thisMonthStart = today.slice(0, 7) + "-01";
      // Current year start
      const thisYearStart = today.slice(0, 4) + "-01-01";

      // If week changed, mark unfinished weekly items as overdue
      if (p._lastWeekStart && p._lastWeekStart < thisWeekStart && Array.isArray(p.weekly)) {
        p.weekly = p.weekly.map(item =>
          !item.done && !item.overdue ? { ...item, overdue: true } : item
        );
      }
      p._lastWeekStart = thisWeekStart;

      // If month changed
      if (p._lastMonthStart && p._lastMonthStart < thisMonthStart && Array.isArray(p.monthly)) {
        p.monthly = p.monthly.map(item =>
          !item.done && !item.overdue ? { ...item, overdue: true } : item
        );
      }
      p._lastMonthStart = thisMonthStart;

      // If year changed
      if (p._lastYearStart && p._lastYearStart < thisYearStart && Array.isArray(p.yearly)) {
        p.yearly = p.yearly.map(item =>
          !item.done && !item.overdue ? { ...item, overdue: true } : item
        );
      }
      p._lastYearStart = thisYearStart;

      // Save updated priorities back if any overdue marking happened
      const hasOverdue = [
        ...(p.weekly ?? []), ...(p.monthly ?? []), ...(p.yearly ?? []),
      ].some(i => i.overdue);

      if (hasOverdue || p._lastWeekStart || p._lastMonthStart || p._lastYearStart) {
        context.priorities = p;
        // Persist the overdue state
        try {
          await sql`
            INSERT INTO user_lab_context (id, user_id, context_type, data, updated_at)
            VALUES (${"ctx_" + user.id + "_priorities"}, ${user.id}, 'priorities', ${JSON.stringify(p)}::jsonb, NOW())
            ON CONFLICT (user_id, context_type)
            DO UPDATE SET data = ${JSON.stringify(p)}::jsonb, updated_at = NOW()
          `;
        } catch {}
      }
    }

    return NextResponse.json({
      todos: {
        today: { todos: parseTodos(todayData?.todos), niceTodos: parseTodos(todayData?.nice_todos) },
        yesterday: { todos: parseTodos(yesterdayData?.todos), niceTodos: parseTodos(yesterdayData?.nice_todos) },
        date: today,
      },
      context,
      ritualCompletions: {
        today: (completionRows as { ritual_id: string }[]).map((r) => r.ritual_id),
        stats: Object.fromEntries((statsRows as { ritual_id: string; count: number }[]).map((r) => [r.ritual_id, r.count])),
      },
    });
  } catch (error) {
    console.error("GET /api/laborator/dashboard-data error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
