import { sql } from "./db";

let sessionsUserIdColumnExists: boolean | null = null;

export async function checkSessionsUserIdColumnExists(): Promise<boolean> {
  if (sessionsUserIdColumnExists !== null) {
    return sessionsUserIdColumnExists;
  }

  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sessions'
          AND column_name = 'user_id'
      ) AS "exists"
    `;
    const row = result[0];
    const value = row && typeof row === "object" && "exists" in row
      ? (row as { exists: boolean }).exists
      : (row as unknown as boolean[])?.[0];
    sessionsUserIdColumnExists = Boolean(value);
    return sessionsUserIdColumnExists;
  } catch {
    sessionsUserIdColumnExists = false;
    return false;
  }
}

/** Reset cached result (e.g. after migration). Call from API if you add the column. */
export function clearSessionsUserIdColumnCache(): void {
  sessionsUserIdColumnExists = null;
}
