import { NextResponse } from "next/server";
import { initializeCoachCrmDatabase } from "../../../../lib/db";

export async function POST() {
  try {
    await initializeCoachCrmDatabase();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("init-db error", error);
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

