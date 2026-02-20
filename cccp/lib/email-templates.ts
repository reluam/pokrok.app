/**
 * Email templates for booking confirmations and reminders
 */

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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Rezervace potvrzena</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-top: 0;">Dobrý den ${name},</p>
          <p style="font-size: 16px;">Vaše rezervace na <strong>${eventTitle}</strong> byla úspěšně potvrzena.</p>
          
          <div style="background: white; border-left: 4px solid #1e293b; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">Detaily rezervace:</p>
            <p style="margin: 5px 0;"><strong>Datum a čas:</strong> ${dateTime}</p>
            <p style="margin: 5px 0;"><strong>Délka:</strong> ${durationMinutes} minut</p>
            ${eventName ? `<p style="margin: 5px 0;"><strong>Typ:</strong> ${eventName}</p>` : ""}
            ${note ? `<p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px solid #e5e7eb;"><strong>Poznámka:</strong><br>${note.replace(/\n/g, "<br>")}</p>` : ""}
          </div>

          <p style="font-size: 16px;">Těšíme se na setkání s vámi.</p>
          <p style="font-size: 16px;">Pokud potřebujete rezervaci změnit nebo zrušit, kontaktujte nás prosím co nejdříve.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">S pozdravem,<br>Tým rezervací</p>
          </div>
        </div>
      </body>
    </html>
  `;
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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Připomínka rezervace</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-top: 0;">Dobrý den ${name},</p>
          <p style="font-size: 16px;">Rádi bychom vám připomněli, že máte zítra rezervaci na <strong>${eventTitle}</strong>.</p>
          
          <div style="background: white; border-left: 4px solid #1e293b; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">Detaily rezervace:</p>
            <p style="margin: 5px 0;"><strong>Datum:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Čas:</strong> ${time}</p>
            <p style="margin: 5px 0;"><strong>Délka:</strong> ${durationMinutes} minut</p>
            ${eventName ? `<p style="margin: 5px 0;"><strong>Typ:</strong> ${eventName}</p>` : ""}
          </div>

          <p style="font-size: 16px;">Těšíme se na setkání s vámi zítra.</p>
          <p style="font-size: 16px;">Pokud potřebujete rezervaci změnit nebo zrušit, kontaktujte nás prosím co nejdříve.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">S pozdravem,<br>Tým rezervací</p>
          </div>
        </div>
      </body>
    </html>
  `;
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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Nová rezervace</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-top: 0;">Dobrý den,</p>
          <p style="font-size: 16px;">Máte novou rezervaci na <strong>${eventTitle}</strong>.</p>
          
          <div style="background: white; border-left: 4px solid #1e293b; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">Detaily rezervace:</p>
            <p style="margin: 5px 0;"><strong>Klient:</strong> ${clientName}</p>
            <p style="margin: 5px 0;"><strong>Email klienta:</strong> ${clientEmail}</p>
            <p style="margin: 5px 0;"><strong>Datum a čas:</strong> ${dateTime}</p>
            <p style="margin: 5px 0;"><strong>Délka:</strong> ${durationMinutes} minut</p>
            ${eventName ? `<p style="margin: 5px 0;"><strong>Typ:</strong> ${eventName}</p>` : ""}
            ${note ? `<p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px solid #e5e7eb;"><strong>Poznámka od klienta:</strong><br>${note.replace(/\n/g, "<br>")}</p>` : ""}
          </div>

          <p style="font-size: 16px;">Rezervace je zobrazena ve vašem kalendáři.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">S pozdravem,<br>Systém rezervací</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
