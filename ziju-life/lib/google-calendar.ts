/** Busy interval from Google Calendar. */
export type BusyInterval = { start: Date; end: Date };

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

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
  const refreshToken = options?.refreshToken ?? process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  try {
    const { google } = await import("googleapis");

    // 1) OAuth2 – žádný JSON klíč, stačí Client ID + Secret + refresh token (z jednorázového „Připojit Google“)
    if (clientId?.trim() && clientSecret?.trim() && refreshToken?.trim()) {
      const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || ""; // callback URL, required for OAuth2Client
      const oauth2 = new google.auth.OAuth2(clientId.trim(), clientSecret.trim(), redirectUri || undefined);
      oauth2.setCredentials({ refresh_token: refreshToken.trim() });
      const calendar = google.calendar({ version: "v3", auth: oauth2 });
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
    }

    // 2) Service Account (JSON) – pokud organizace povoluje
    if (json?.trim()) {
      const credentials = JSON.parse(json) as { client_email?: string; private_key?: string };
      if (!credentials.client_email || !credentials.private_key) return [];
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [CALENDAR_SCOPE],
      });
      const calendar = google.calendar({ version: "v3", auth });
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
    }

    return [];
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
