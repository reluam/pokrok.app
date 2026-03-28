import { sql } from "./database";

/**
 * Load AI-generated user profile summary from coaching conversations.
 * Returns empty string if no profile exists yet.
 */
export async function getAIProfileSummary(userId: string): Promise<string> {
  try {
    const rows = (await sql`
      SELECT profile_summary FROM user_ai_profile WHERE user_id = ${userId}
    `) as { profile_summary: string | null }[];
    return rows[0]?.profile_summary || "";
  } catch {
    return "";
  }
}
