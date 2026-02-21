/**
 * Email templates for booking confirmations and reminders
 * Styling inspired by Žiju life newsletter – čistá karta, jemný stín, výrazný levý pruh
 */

const ACCENT_COLOR = "#FF8C42";
const TEXT_DARK = "#171717";
const TEXT_MUTED = "#666666";
const BORDER_COLOR = "#e5e5e5";
const BOX_BG = "#f5f5f5";
const FOOTER_COLOR = "#999999";

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Prague",
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Prague",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Prague",
  });
}

function emailWrapper(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff; border-bottom: 1px solid ${BORDER_COLOR};">
              <h1 style="color: ${TEXT_DARK}; font-size: 26px; font-weight: bold; margin: 0; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #ffffff; border-top: 1px solid ${BORDER_COLOR};">
              <p style="color: ${FOOTER_COLOR}; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Tento e-mail byl odeslán automaticky v rámci rezervačního systému.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function renderBookingConfirmationEmail(params: {
  name: string;
  scheduledAt: string;
  durationMinutes: number;
  eventName?: string;
  note?: string;
}): string {
  const { name, scheduledAt, durationMinutes, eventName, note } = params;
  const dateTime = formatDateTime(scheduledAt);
  const eventTitle = eventName || "Konzultace";

  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Ahoj ${name},
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Rezervace na <strong>${eventTitle}</strong> je potvrzená. Tady máš přehled:
    </p>

    <div style="height: 1px; background-color: ${BORDER_COLOR}; margin: 28px 0;"></div>

    <div style="margin-bottom: 24px; padding: 24px; background-color: ${BOX_BG}; border-radius: 8px; border-left: 4px solid ${ACCENT_COLOR};">
      <p style="color: ${TEXT_DARK}; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
        📅 Detaily rezervace
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Datum a čas:</strong> ${dateTime}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Délka:</strong> ${durationMinutes} minut
      </p>
      ${eventName ? `<p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;"><strong style="color: ${TEXT_DARK};">Typ:</strong> ${eventName}</p>` : ""}
      ${note ? `<p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 16px 0 0; padding-top: 16px; border-top: 1px solid ${BORDER_COLOR};"><strong style="color: ${TEXT_DARK};">Tvá poznámka:</strong><br>${note.replace(/\n/g, "<br>")}</p>` : ""}
    </div>

    <div style="height: 1px; background-color: ${BORDER_COLOR}; margin: 28px 0;"></div>

    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
      Těšíme se na setkání. Pokud budeš potřebovat termín změnit nebo zrušit, napiš nám co nejdřív.
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0;">
      S pozdravem,<br><strong>Rezervační tým</strong>
    </p>
  `;

  return emailWrapper("Rezervace potvrzena", content);
}

export function renderBookingReminderEmail(params: {
  name: string;
  scheduledAt: string;
  durationMinutes: number;
  eventName?: string;
}): string {
  const { name, scheduledAt, durationMinutes, eventName } = params;
  const date = formatDate(scheduledAt);
  const time = formatTime(scheduledAt);
  const eventTitle = eventName || "Konzultace";

  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Ahoj ${name},
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Připomínáme ti zítřejší rezervaci na <strong>${eventTitle}</strong>.
    </p>

    <div style="height: 1px; background-color: ${BORDER_COLOR}; margin: 28px 0;"></div>

    <div style="margin-bottom: 24px; padding: 24px; background-color: ${BOX_BG}; border-radius: 8px; border-left: 4px solid ${ACCENT_COLOR};">
      <p style="color: ${TEXT_DARK}; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
        📅 Detaily rezervace
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Datum:</strong> ${date}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Čas:</strong> ${time}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Délka:</strong> ${durationMinutes} minut
      </p>
      ${eventName ? `<p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0;"><strong style="color: ${TEXT_DARK};">Typ:</strong> ${eventName}</p>` : ""}
    </div>

    <div style="height: 1px; background-color: ${BORDER_COLOR}; margin: 28px 0;"></div>

    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
      Těšíme se na setkání zítra. Při změně plánů nás prosím co nejdříve kontaktuj.
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0;">
      S pozdravem,<br><strong>Rezervační tým</strong>
    </p>
  `;

  return emailWrapper("Připomínka rezervace", content);
}

export function renderCoachNotificationEmail(params: {
  clientName: string;
  clientEmail: string;
  scheduledAt: string;
  durationMinutes: number;
  eventName?: string;
  note?: string;
}): string {
  const { clientName, clientEmail, scheduledAt, durationMinutes, eventName, note } = params;
  const dateTime = formatDateTime(scheduledAt);
  const eventTitle = eventName || "Konzultace";

  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Ahoj,
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Máš novou rezervaci na <strong>${eventTitle}</strong>. Shrnutí:
    </p>

    <div style="height: 1px; background-color: ${BORDER_COLOR}; margin: 28px 0;"></div>

    <div style="margin-bottom: 24px; padding: 24px; background-color: ${BOX_BG}; border-radius: 8px; border-left: 4px solid ${ACCENT_COLOR};">
      <p style="color: ${TEXT_DARK}; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
        📅 Nová rezervace
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Klient:</strong> ${clientName}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">E-mail:</strong> <a href="mailto:${clientEmail}" style="color: ${ACCENT_COLOR}; text-decoration: underline;">${clientEmail}</a>
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Datum a čas:</strong> ${dateTime}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Délka:</strong> ${durationMinutes} minut
      </p>
      ${eventName ? `<p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;"><strong style="color: ${TEXT_DARK};">Typ:</strong> ${eventName}</p>` : ""}
      ${note ? `<p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 16px 0 0; padding-top: 16px; border-top: 1px solid ${BORDER_COLOR};"><strong style="color: ${TEXT_DARK};">Poznámka od klienta:</strong><br>${note.replace(/\n/g, "<br>")}</p>` : ""}
    </div>

    <div style="height: 1px; background-color: ${BORDER_COLOR}; margin: 28px 0;"></div>

    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0;">
      Rezervace je zobrazená ve tvém kalendáři. Odpověď na tento e-mail pošleš přímo klientovi.
    </p>
  `;

  return emailWrapper("Nová rezervace", content);
}
