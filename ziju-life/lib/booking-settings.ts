import { sql } from "./database";

export async function getBookingSettings(): Promise<{
  clickupListId: string | null;
  googleCalendarId: string;
  googleRefreshToken: string | null;
}> {
  try {
    const row = await sql`
      SELECT clickup_list_id, google_calendar_id, google_refresh_token FROM admin_settings LIMIT 1
    ` as { clickup_list_id: string | null; google_calendar_id: string | null; google_refresh_token?: string | null }[];
    const r = row[0];
    return {
      clickupListId: (r?.clickup_list_id?.trim() || process.env.CLICKUP_LIST_ID?.trim()) ?? null,
      googleCalendarId: r?.google_calendar_id?.trim() || process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
      googleRefreshToken: r?.google_refresh_token?.trim() || process.env.GOOGLE_REFRESH_TOKEN?.trim() || null,
    };
  } catch {
    return {
      clickupListId: process.env.CLICKUP_LIST_ID?.trim() ?? null,
      googleCalendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
      googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim() || null,
    };
  }
}
