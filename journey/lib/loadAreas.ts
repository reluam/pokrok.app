// Server-only data access. Uses Neon Postgres when DATABASE_URL is set
// (production), otherwise falls back to the bundled JSON file (local dev).
import "server-only";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Area } from "./areas";
import { hasDb, dbLoadAreas, dbSaveAreas } from "./db";

const FILE_PATH = join(process.cwd(), "data", "areas.json");

// Bump this whenever data/areas.json is changed in the repo and the change
// must be force-applied to the production DB (overwrites stored content on the
// next load). Normal admin edits keep the current version and are preserved.
export const CONTENT_VERSION = 2;

function readFile(): Area[] {
  const raw = readFileSync(FILE_PATH, "utf-8");
  return (JSON.parse(raw) as { areas: Area[] }).areas;
}

export async function loadAreas(): Promise<Area[]> {
  if (hasDb) return dbLoadAreas(readFile, CONTENT_VERSION);
  return readFile();
}

export async function saveAreas(areas: Area[]): Promise<void> {
  if (hasDb) {
    await dbSaveAreas(areas, CONTENT_VERSION);
    return;
  }
  writeFileSync(FILE_PATH, JSON.stringify({ areas }, null, 2), "utf-8");
}
