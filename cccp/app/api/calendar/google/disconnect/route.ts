import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../../lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sql`
    DELETE FROM calendar_connections
    WHERE user_id = ${userId} AND provider = 'google'
  `;

  return NextResponse.json({ ok: true });
}
