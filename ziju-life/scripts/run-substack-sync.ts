/**
 * One-off: Run Substack sync locally.
 * Run with: npx tsx scripts/run-substack-sync.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

try {
  const envPath = join(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // rely on process.env
}

(async () => {
  const { syncSubstack } = await import("../lib/pipeline/substack-sync");
  const result = await syncSubstack();
  console.log(JSON.stringify(result, null, 2));
})();
