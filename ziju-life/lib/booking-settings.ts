import { sql } from "./database";

export type ClickUpFieldConfig = {
  fieldMail: string | null;
  fieldZdroj: string | null;
  fieldJmeno: string | null;
  fieldStatus: string | null;
  statusReachOut: string | null; // option id (number as string)
  statusMeeting: string | null;  // option id (number as string)
};

export async function getBookingSettings(): Promise<{
  clickupListId: string | null;
  clickupFieldConfig: ClickUpFieldConfig;
  googleCalendarId: string;
  googleRefreshToken: string | null;
}> {
  const emptyFieldConfig: ClickUpFieldConfig = {
    fieldMail: null,
    fieldZdroj: null,
    fieldJmeno: null,
    fieldStatus: null,
    statusReachOut: null,
    statusMeeting: null,
  };
  try {
    let row: {
      clickup_list_id: string | null;
      google_calendar_id: string | null;
      google_refresh_token?: string | null;
      clickup_field_mail?: string | null;
      clickup_field_zdroj?: string | null;
      clickup_field_jmeno?: string | null;
      clickup_field_status?: string | null;
      clickup_status_reach_out?: string | null;
      clickup_status_meeting?: string | null;
    }[];
    try {
      row = await sql`
        SELECT clickup_list_id, google_calendar_id, google_refresh_token,
               clickup_field_mail, clickup_field_zdroj, clickup_field_jmeno,
               clickup_field_status, clickup_status_reach_out, clickup_status_meeting
        FROM admin_settings LIMIT 1
      ` as typeof row;
    } catch {
      row = await sql`
        SELECT clickup_list_id, google_calendar_id, google_refresh_token
        FROM admin_settings LIMIT 1
      ` as { clickup_list_id: string | null; google_calendar_id: string | null; google_refresh_token?: string | null }[];
    }
    const r = row[0] as {
      clickup_list_id: string | null;
      google_calendar_id: string | null;
      google_refresh_token?: string | null;
      clickup_field_mail?: string | null;
      clickup_field_zdroj?: string | null;
      clickup_field_jmeno?: string | null;
      clickup_field_status?: string | null;
      clickup_status_reach_out?: string | null;
      clickup_status_meeting?: string | null;
    };
    return {
      clickupListId: (r?.clickup_list_id?.trim() || process.env.CLICKUP_LIST_ID?.trim()) ?? null,
      clickupFieldConfig: {
        fieldMail: r?.clickup_field_mail?.trim() ?? null,
        fieldZdroj: r?.clickup_field_zdroj?.trim() ?? null,
        fieldJmeno: r?.clickup_field_jmeno?.trim() ?? null,
        fieldStatus: r?.clickup_field_status?.trim() ?? null,
        statusReachOut: r?.clickup_status_reach_out?.trim() ?? null,
        statusMeeting: r?.clickup_status_meeting?.trim() ?? null,
      },
      googleCalendarId: r?.google_calendar_id?.trim() || process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
      googleRefreshToken: r?.google_refresh_token?.trim() || process.env.GOOGLE_REFRESH_TOKEN?.trim() || null,
    };
  } catch {
    return {
      clickupListId: process.env.CLICKUP_LIST_ID?.trim() ?? null,
      clickupFieldConfig: emptyFieldConfig,
      googleCalendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
      googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim() || null,
    };
  }
}
