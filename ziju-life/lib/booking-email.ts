import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const adminEmail = process.env.BOOKING_ADMIN_EMAIL || process.env.CONTACT_EMAIL || "matej@ziju.life";

/** Odesílatel pro potvrzení klientovi: Matěj z Žiju.life */
const fromClient = `Matěj z Žiju.life <${fromEmail}>`;
/** Odesílatel pro potvrzení tobě (admin): Žiju life - Rezervace */
const fromAdmin = `Žiju life - Rezervace <${fromEmail}>`;

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://ziju.life";
}

function formatSlot(d: Date): string {
  return d.toLocaleString("cs-CZ", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Styling jako newsletter – čistá karta, logo, výrazný levý pruh
const ACCENT = "#FF8C42";
const TEXT_DARK = "#171717";
const TEXT_MUTED = "#666666";
const BORDER = "#e5e5e5";
const BOX_BG = "#f5f5f5";

function emailWrapper(title: string, content: string): string {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/ziju-life-logo.png`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background-color: #ffffff;">
              <a href="${siteUrl}" style="display: inline-block; text-decoration: none; border: 0;">
                <img src="${logoUrl}" alt="Žiju life" width="200" height="80" style="max-width: 200px; width: 200px; height: auto; display: block; margin: 0 auto; border: 0; outline: none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px; text-align: center; border-bottom: 1px solid ${BORDER};">
              <h1 style="color: ${TEXT_DARK}; font-size: 24px; font-weight: bold; margin: 0; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #ffffff; border-top: 1px solid ${BORDER};">
              <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Žiju life · ${siteUrl.replace(/^https?:\/\//, "")}
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

function renderClientConfirmationHtml(name: string, slotStr: string, durationMinutes: number): string {
  const safeName = escapeHtml(name);
  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Ahoj ${safeName},
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Rezervace konzultace je potvrzená. Tady máš přehled:
    </p>

    <div style="margin-bottom: 24px; padding: 24px; background-color: ${BOX_BG}; border-radius: 8px; border-left: 4px solid ${ACCENT};">
      <p style="color: ${TEXT_DARK}; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
        📅 Detaily rezervace
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Termín:</strong> ${slotStr}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0;">
        <strong style="color: ${TEXT_DARK};">Délka:</strong> ${durationMinutes} min
      </p>
    </div>

    <div style="height: 1px; background-color: ${BORDER}; margin: 28px 0;"></div>

    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
      Těším se na setkání.
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0;">
      Měj pěkný den,<br><strong>Matěj</strong>
    </p>
  `;
  return emailWrapper("Rezervace potvrzena", content);
}

function renderAdminConfirmationHtml(
  clientName: string,
  clientEmail: string,
  slotStr: string,
  durationMinutes: number,
  note?: string | null,
  source?: string
): string {
  const safeName = escapeHtml(clientName);
  const safeNote = note ? escapeHtml(note) : "";
  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Nová rezervace konzultace – přehled:
    </p>

    <div style="margin-bottom: 24px; padding: 24px; background-color: ${BOX_BG}; border-radius: 8px; border-left: 4px solid ${ACCENT};">
      <p style="color: ${TEXT_DARK}; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
        📅 Nová rezervace
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Jméno:</strong> ${safeName}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">E-mail:</strong> <a href="mailto:${clientEmail}" style="color: ${ACCENT}; text-decoration: underline;">${clientEmail}</a>
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Termín:</strong> ${slotStr}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Délka:</strong> ${durationMinutes} min
      </p>
      ${source ? `<p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;"><strong style="color: ${TEXT_DARK};">Zdroj:</strong> ${escapeHtml(source)}</p>` : ""}
      ${safeNote ? `<p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 16px 0 0; padding-top: 16px; border-top: 1px solid ${BORDER};"><strong style="color: ${TEXT_DARK};">Poznámka:</strong><br>${safeNote.replace(/\n/g, "<br>")}</p>` : ""}
    </div>

    <p style="color: ${TEXT_DARK}; font-size: 14px; line-height: 1.6; margin: 0;">
      Odpověď na tento e-mail pošleš přímo klientovi.
    </p>
  `;
  return emailWrapper("Nová rezervace", content);
}

function renderReminderHtml(name: string, slotStr: string, durationMinutes: number): string {
  const safeName = escapeHtml(name);
  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Ahoj ${safeName},
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Připomínám zítřejší konzultaci:
    </p>

    <div style="margin-bottom: 24px; padding: 24px; background-color: ${BOX_BG}; border-radius: 8px; border-left: 4px solid ${ACCENT};">
      <p style="color: ${TEXT_DARK}; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
        📅 Detaily rezervace
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        <strong style="color: ${TEXT_DARK};">Termín:</strong> ${slotStr}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0;">
        <strong style="color: ${TEXT_DARK};">Délka:</strong> ${durationMinutes} min
      </p>
    </div>

    <div style="height: 1px; background-color: ${BORDER}; margin: 28px 0;"></div>

    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
      Těším se na setkání.
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0;">
      Měj pěkný den,<br><strong>Matěj</strong>
    </p>
  `;
  return emailWrapper("Připomínka konzultace", content);
}

/** Odeslat potvrzení rezervace klientovi (od: Matěj z Žiju.life). */
export async function sendBookingConfirmationToClient(params: {
  to: string;
  name: string;
  slotAt: Date;
  durationMinutes: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn("[booking-email] RESEND_API_KEY not set, skipping client confirmation");
    return { ok: false, error: "Resend not configured" };
  }
  try {
    const { to, name, slotAt, durationMinutes } = params;
    const slotStr = formatSlot(slotAt);
    const html = renderClientConfirmationHtml(name, slotStr, durationMinutes);
    const { error } = await resend.emails.send({
      from: fromClient,
      to: [to],
      subject: `Rezervace potvrzena – ${slotStr}`,
      html,
    });
    if (error) {
      console.warn("[booking-email] Client confirmation failed:", error);
      return { ok: false, error: String(error) };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[booking-email] sendBookingConfirmationToClient error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Odeslat ti na mail přehled o nové rezervaci (od: Žiju life - Rezervace). */
export async function sendBookingConfirmationToAdmin(params: {
  clientName: string;
  clientEmail: string;
  slotAt: Date;
  durationMinutes: number;
  note?: string | null;
  source?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return { ok: false, error: "Resend not configured" };
  }
  try {
    const { clientName, clientEmail, slotAt, durationMinutes, note, source } = params;
    const slotStr = formatSlot(slotAt);
    const html = renderAdminConfirmationHtml(clientName, clientEmail, slotStr, durationMinutes, note, source);
    const { error } = await resend.emails.send({
      from: fromAdmin,
      to: [adminEmail],
      subject: `Nová rezervace – ${clientName} – ${slotStr}`,
      html,
    });
    if (error) {
      console.warn("[booking-email] Admin confirmation failed:", error);
      return { ok: false, error: String(error) };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[booking-email] sendBookingConfirmationToAdmin error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Připomínka 24 h před schůzkou – odeslat klientovi (od: Matěj z Žiju.life). */
export async function sendBookingReminderToClient(params: {
  to: string;
  name: string;
  slotAt: Date;
  durationMinutes: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return { ok: false, error: "Resend not configured" };
  }
  try {
    const { to, name, slotAt, durationMinutes } = params;
    const slotStr = formatSlot(slotAt);
    const html = renderReminderHtml(name, slotStr, durationMinutes);
    const { error } = await resend.emails.send({
      from: fromClient,
      to: [to],
      subject: `Připomínka: konzultace zítra – ${slotStr}`,
      html,
    });
    if (error) {
      console.warn("[booking-email] Reminder failed:", error);
      return { ok: false, error: String(error) };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[booking-email] sendBookingReminderToClient error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
