import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_PATH = join(process.cwd(), "data", "areas.json");

export async function GET() {
  const data = readFileSync(DATA_PATH, "utf-8");
  return NextResponse.json(JSON.parse(data));
}

export async function PUT(req: Request) {
  const body = await req.json();
  writeFileSync(DATA_PATH, JSON.stringify(body, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
