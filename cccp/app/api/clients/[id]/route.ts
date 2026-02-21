import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { project_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.project_id !== undefined) {
    const projectId = body.project_id === null || body.project_id === "" ? null : String(body.project_id).trim();
    await sql`
      UPDATE clients SET project_id = ${projectId}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  const rows = await sql`
    SELECT id, lead_id, name, email, status, project_id, created_at
    FROM clients WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  ` as { id: string; lead_id: string | null; name: string; email: string | null; status: string; project_id: string | null; created_at: string }[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
