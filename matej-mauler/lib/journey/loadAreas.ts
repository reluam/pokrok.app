// Server-only data access. Uses Neon Postgres when DATABASE_URL is set
// (production), otherwise the bundled JSON seed (read-only fallback).
import "server-only";
import type { Area } from "./areas";
import { hasDb, dbLoadAreas, dbSaveAreas } from "./db";
import seed from "@/data/areas.json";

// Bump when data/areas.json changes and must be force-applied to the DB.
export const CONTENT_VERSION = 3;

function readFile(): Area[] {
  return (seed as unknown as { areas: Area[] }).areas;
}

export async function loadAreas(): Promise<Area[]> {
  if (hasDb) return dbLoadAreas(readFile, CONTENT_VERSION);
  return readFile();
}

export async function saveAreas(areas: Area[]): Promise<void> {
  // Produkce → DB. Bez DB (lokálně) se neukládá (seed je bundlovaný, read-only).
  if (hasDb) await dbSaveAreas(areas, CONTENT_VERSION);
}
