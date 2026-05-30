// Server-only — uses Node fs. Only call from server components or API routes.
import { readFileSync } from "fs";
import { join } from "path";
import type { Area } from "./areas";

export function loadAreas(): Area[] {
  const raw = readFileSync(join(process.cwd(), "data", "areas.json"), "utf-8");
  return (JSON.parse(raw) as { areas: Area[] }).areas;
}
