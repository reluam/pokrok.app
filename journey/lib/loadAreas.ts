// Server-only data access. Uses Neon Postgres when DATABASE_URL is set
// (production), otherwise falls back to the bundled JSON file (local dev).
import "server-only";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Area } from "./areas";
import { hasDb, dbLoadAreas, dbSaveAreas } from "./db";

const FILE_PATH = join(process.cwd(), "data", "areas.json");

function readFile(): Area[] {
  const raw = readFileSync(FILE_PATH, "utf-8");
  return (JSON.parse(raw) as { areas: Area[] }).areas;
}

export async function loadAreas(): Promise<Area[]> {
  if (hasDb) return dbLoadAreas(readFile);
  return readFile();
}

export async function saveAreas(areas: Area[]): Promise<void> {
  if (hasDb) {
    await dbSaveAreas(areas);
    return;
  }
  writeFileSync(FILE_PATH, JSON.stringify({ areas }, null, 2), "utf-8");
}
