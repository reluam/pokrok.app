import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { sql, ensureCoreTables } from "@/lib/database";

export const dynamic = "force-dynamic";

function getDateStr(d: Date = new Date()): string {
  return d.toISOString().split("T")[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

interface TodoItem { text: string; done: boolean }

export async function GET(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCoreTables();
    const today = getDateStr();
    const yesterday = getYesterdayStr();

    const rows = (await sql`
      SELECT date, todos, nice_todos FROM daily_todos
      WHERE user_id = ${user.id} AND date IN (${today}, ${yesterday})
      ORDER BY date DESC
    `) as { date: string; todos: TodoItem[]; nice_todos: TodoItem[] }[];

    const todayData = rows.find((r) => String(r.date).startsWith(today));
    const yesterdayData = rows.find((r) => String(r.date).startsWith(yesterday));

    return NextResponse.json({
      today: { todos: todayData?.todos ?? [], niceTodos: todayData?.nice_todos ?? [] },
      yesterday: { todos: yesterdayData?.todos ?? [], niceTodos: yesterdayData?.nice_todos ?? [] },
      date: today,
    });
  } catch (error) {
    console.error("GET /api/laborator/daily-todos error:", error);
    return NextResponse.json({ error: "Failed to load todos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCoreTables();
    const body = await request.json();
    const { todos, niceTodos } = body;

    if (!Array.isArray(todos) || !Array.isArray(niceTodos)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Enforce limits
    const limitedTodos = todos.slice(0, 3);
    const limitedNice = niceTodos.slice(0, 3);

    const today = getDateStr();
    const id = `todo_${user.id}_${today}`;

    await sql`
      INSERT INTO daily_todos (id, user_id, date, todos, nice_todos)
      VALUES (${id}, ${user.id}, ${today}, ${JSON.stringify(limitedTodos)}, ${JSON.stringify(limitedNice)})
      ON CONFLICT (user_id, date)
      DO UPDATE SET todos = ${JSON.stringify(limitedTodos)}, nice_todos = ${JSON.stringify(limitedNice)}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/laborator/daily-todos error:", error);
    return NextResponse.json({ error: "Failed to save todos" }, { status: 500 });
  }
}
