import { sql } from "./db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export type CalendarConnection = {
  id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  calendar_id: string | null;
};

export async function getCalendarConnection(
  userId: string
): Promise<CalendarConnection | null> {
  const rows = (await sql`
    SELECT id, user_id, access_token, refresh_token, expires_at, calendar_id
    FROM calendar_connections
    WHERE user_id = ${userId} AND provider = 'google'
    LIMIT 1
  `) as CalendarConnection[];
  return rows[0] ?? null;
}

export async function getConnectionForSlots(
  userId?: string
): Promise<CalendarConnection | null> {
  if (userId) {
    return getCalendarConnection(userId);
  }
  const rows = (await sql`
    SELECT id, user_id, access_token, refresh_token, expires_at, calendar_id
    FROM calendar_connections
    WHERE provider = 'google' AND refresh_token IS NOT NULL
    LIMIT 1
  `) as CalendarConnection[];
  return rows[0] ?? null;
}

/** Calendar IDs to use for slot blocking for a user (from user_calendars, or fallback to primary) */
export async function getCalendarIdsForUser(userId: string): Promise<string[]> {
  const rows = (await sql`
    SELECT calendar_id FROM user_calendars
    WHERE user_id = ${userId} AND provider = 'google'
    ORDER BY is_primary DESC, created_at ASC
  `) as { calendar_id: string }[];
  if (rows.length > 0) {
    return rows.map((r) => r.calendar_id);
  }
  const conn = await getCalendarConnection(userId);
  const id = conn?.calendar_id ?? "primary";
  return [id];
}

async function refreshAccessToken(conn: CalendarConnection): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !conn.refresh_token) {
    throw new Error("Google Calendar: missing config or refresh_token");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await sql`
    UPDATE calendar_connections
    SET access_token = ${data.access_token}, expires_at = ${expiresAt}, updated_at = NOW()
    WHERE id = ${conn.id}
  `;

  return data.access_token;
}

export async function getValidAccessToken(
  conn: CalendarConnection
): Promise<string> {
  const now = Date.now();
  const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  if (conn.access_token && expiresAt > now + 60 * 1000) {
    return conn.access_token;
  }
  return refreshAccessToken(conn);
}

export type GoogleCalendarEvent = {
  start: string; // ISO or date
  end: string;
};

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string,
  from: Date,
  to: Date
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("timeMin", from.toISOString());
  url.searchParams.set("timeMax", to.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error("Google Calendar events fetch failed:", calendarId, res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as {
    items?: Array<{
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  const events: GoogleCalendarEvent[] = [];
  for (const item of data.items ?? []) {
    const start = item.start?.dateTime ?? item.start?.date;
    const end = item.end?.dateTime ?? item.end?.date;
    if (start && end) events.push({ start, end });
  }
  return events;
}

/** Fetch events from all calendars for a user and merge (for slot blocking). */
export async function fetchGoogleCalendarEventsForUser(
  userId: string,
  from: Date,
  to: Date
): Promise<GoogleCalendarEvent[]> {
  const conn = await getCalendarConnection(userId);
  if (!conn) return [];

  const accessToken = await getValidAccessToken(conn);
  const calendarIds = await getCalendarIdsForUser(userId);

  const allEvents: GoogleCalendarEvent[] = [];
  for (const calendarId of calendarIds) {
    const events = await fetchEventsForCalendar(accessToken, calendarId, from, to);
    allEvents.push(...events);
  }

  // Sort by start and dedupe overlapping ranges (same start/end)
  allEvents.sort((a, b) => a.start.localeCompare(b.start));
  const seen = new Set<string>();
  return allEvents.filter((e) => {
    const key = `${e.start}|${e.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Legacy: fetch from single connection (any user). Prefer fetchGoogleCalendarEventsForUser(userId, ...). */
export async function fetchGoogleCalendarEvents(
  from: Date,
  to: Date
): Promise<GoogleCalendarEvent[]> {
  const conn = await getConnectionForSlots();
  if (!conn) return [];
  return fetchGoogleCalendarEventsForUser(conn.user_id, from, to);
}
