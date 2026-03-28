import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { sql, ensureCoreTables } from "@/lib/database";

export const dynamic = "force-dynamic";

/** Get date in Europe/Prague timezone as YYYY-MM-DD */
function getLocalDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" });
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

    // Compose todos — handle double-encoded JSON
    const todayData = (todoRows as { date: string; todos: unknown; nice_todos: unknown }[])
      .find((r) => String(r.date).startsWith(today));
    const yesterdayData = (todoRows as { date: string; todos: unknown; nice_todos: unknown }[])
      .find((r) => String(r.date).startsWith(yesterday));

    // Compose context
    const context: Record<string, unknown> = {};
    for (const row of contextRows as { context_type: string; data: unknown }[]) {
      context[row.context_type] = row.data;
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
