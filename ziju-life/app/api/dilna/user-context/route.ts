import { NextRequest, NextResponse } from "next/server";
import { checkDilnaAccess } from "@/lib/dilna-auth";
import { getDilnaUser } from "@/lib/dilna-user";
import { sql } from "@/lib/database";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["compass", "values", "rituals", "priorities"];

/** GET — load all user context */
export async function GET(request: NextRequest) {
  const user = await getDilnaUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkDilnaAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = (await sql`
      SELECT context_type, data, updated_at
      FROM user_lab_context
      WHERE user_id = ${user.id}
    `) as { context_type: string; data: unknown; updated_at: Date }[];

    const context: Record<string, unknown> = {};
    for (const row of rows) {
      context[row.context_type] = row.data;
    }

    return NextResponse.json({ context });
  } catch (error) {
    console.error("GET /api/dilna/user-context error:", error);
    return NextResponse.json({ error: "Failed to load context" }, { status: 500 });
  }
}

/** POST — save/update user context */
export async function POST(request: NextRequest) {
  const user = await getDilnaUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkDilnaAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {


    const body = await request.json();
    const { type, data } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid context type" }, { status: 400 });
    }
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const id = `ctx_${user.id}_${type}`;

    await sql`
      INSERT INTO user_lab_context (id, user_id, context_type, data, updated_at)
      VALUES (${id}, ${user.id}, ${type}, ${JSON.stringify(data)}, NOW())
      ON CONFLICT (user_id, context_type)
      DO UPDATE SET data = ${JSON.stringify(data)}, updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/dilna/user-context error:", error);
    return NextResponse.json({ error: "Failed to save context" }, { status: 500 });
  }
}
