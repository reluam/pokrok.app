/** Busy interval from Google Calendar. */
export type BusyInterval = { start: Date; end: Date };

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

async function buildCalendarClient(refreshToken?: string | null) {
  const { google } = await import("googleapis");
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const token = refreshToken?.trim() || process.env.GOOGLE_REFRESH_TOKEN?.trim();

  if (clientId && clientSecret && token) {
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || undefined;
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2.setCredentials({ refresh_token: token });
    return google.calendar({ version: "v3", auth: oauth2 });
  }

  if (json) {
    const credentials = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!credentials.client_email || !credentials.private_key) return null;
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [CALENDAR_SCOPE],
    });
    return google.calendar({ version: "v3", auth });
  }

  return null;
}

/**
 * Get busy intervals from Google Calendar.
 * Supports two auth methods (no JSON key needed):
 * 1) OAuth2: set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET and pass refreshToken (from DB or GOOGLE_REFRESH_TOKEN).
 * 2) Service account: set GOOGLE_SERVICE_ACCOUNT_JSON (if your org allows it).
 * Returns [] if no valid auth or on error.
 */
export async function getBusyIntervals(
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
  options?: { refreshToken?: string | null }
): Promise<BusyInterval[]> {
  try {
    const calendar = await buildCalendarClient(options?.refreshToken);
    if (!calendar) return [];
    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
    });
    return (res.data.items || []).map((ev) => ({
      start: new Date(String(ev.start?.dateTime || ev.start?.date || 0)),
      end: new Date(String(ev.end?.dateTime || ev.end?.date || 0)),
    }));
  } catch (err) {
    console.warn("[google-calendar] getBusyIntervals failed:", err);
    return [];
  }
}

export function slotOverlapsBusy(
  slotStart: Date,
  slotEnd: Date,
  busy: BusyInterval[]
): boolean {
  for (const b of busy) {
    if (slotStart < b.end && slotEnd > b.start) return true;
  }
  return false;
}

/**
 * Create a calendar event with an automatic Google Meet link.
 * Adds attendees and sends invitations via Google.
 * Returns null if calendar is not configured or the call fails (caller should not block on this).
 */
export async function createCalendarEvent(params: {
  calendarId: string;
  refreshToken?: string | null;
  start: Date;
  durationMinutes: number;
  summary: string;
  description?: string;
  attendees?: { email: string; name?: string }[];
  timeZone?: string;
}): Promise<{ eventId: string; meetUrl: string | null } | null> {
  try {
    const calendar = await buildCalendarClient(params.refreshToken);
    if (!calendar) return null;

    const end = new Date(params.start.getTime() + params.durationMinutes * 60 * 1000);
    const tz = params.timeZone || "Europe/Prague";
    const requestId = `ziju-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const res = await calendar.events.insert({
      calendarId: params.calendarId,
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.start.toISOString(), timeZone: tz },
        end: { dateTime: end.toISOString(), timeZone: tz },
        attendees: params.attendees?.map((a) => ({
          email: a.email,
          displayName: a.name,
        })),
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: { useDefault: true },
      },
    });

    const eventId = res.data.id?.trim();
    if (!eventId) return null;
    const meetUrl =
      res.data.hangoutLink?.trim() ||
      res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
      null;
    return { eventId, meetUrl: meetUrl ?? null };
  } catch (err) {
    console.warn("[google-calendar] createCalendarEvent failed:", err);
    return null;
  }
}
