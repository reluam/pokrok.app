import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "../../../lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, name, email
    FROM clients
    WHERE user_id = ${userId}
    ORDER BY name ASC
  `;

  return NextResponse.json(rows);
}
