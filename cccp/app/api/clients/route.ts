import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "../../../lib/db";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectIdsParam = searchParams.get("projectIds");
  const projectIds = projectIdsParam ? projectIdsParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  let rows;
  if (projectIds.length > 0) {
    rows = await sql`
      SELECT id, name, email, project_id
      FROM clients
      WHERE user_id = ${userId} AND project_id = ANY(${projectIds})
      ORDER BY name ASC
    `;
  } else {
    rows = await sql`
      SELECT id, name, email, project_id
      FROM clients
      WHERE user_id = ${userId}
      ORDER BY name ASC
    `;
  }

  return NextResponse.json(rows);
}
