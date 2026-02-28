import { sql } from "./database";

export async function getAdminSettings() {
  try {
    const rows = (await sql`
      SELECT show_principles
      FROM admin_settings
      LIMIT 1
    `) as { show_principles?: boolean | null }[];
    const row = rows[0];
    return {
      showPrinciples: row?.show_principles ?? true,
    };
  } catch {
    return {
      showPrinciples: true,
    };
  }
}

