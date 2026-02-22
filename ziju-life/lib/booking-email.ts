import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const adminEmail = process.env.BOOKING_ADMIN_EMAIL || process.env.CONTACT_EMAIL || "matej@ziju.life";

function formatSlot(d: Date): string {
  return d.toLocaleString("cs-CZ", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/** Odeslat potvrzení rezervace klientovi (na jeho e-mail). */
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
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `Rezervace potvrzena – ${slotStr}`,
      html: `
        <p>Ahoj ${name.replace(/</g, "&lt;")},</p>
        <p>Rezervace konzultace je potvrzena.</p>
        <p><strong>Termín:</strong> ${slotStr}<br>
        <strong>Délka:</strong> ${durationMinutes} min</p>
        <p>Těším se na setkání.<br>Matěj</p>
      `,
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

/** Odeslat ti na mail přehled o nové rezervaci. */
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
    const { error } = await resend.emails.send({
      from,
      to: [adminEmail],
      subject: `Nová rezervace – ${clientName} – ${slotStr}`,
      html: `
        <p>Nová rezervace konzultace:</p>
        <ul>
          <li><strong>Jméno:</strong> ${clientName.replace(/</g, "&lt;")}</li>
          <li><strong>E-mail:</strong> ${clientEmail}</li>
          <li><strong>Termín:</strong> ${slotStr}</li>
          <li><strong>Délka:</strong> ${durationMinutes} min</li>
          ${source ? `<li><strong>Zdroj:</strong> ${source}</li>` : ""}
          ${note ? `<li><strong>Poznámka:</strong> ${note.replace(/</g, "&lt;")}</li>` : ""}
        </ul>
      `,
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

/** Připomínka 24 h před schůzkou – odeslat klientovi. */
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
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `Připomínka: konzultace zítra – ${slotStr}`,
      html: `
        <p>Ahoj ${name.replace(/</g, "&lt;")},</p>
        <p>Připomínám zítřejší konzultaci:</p>
        <p><strong>Termín:</strong> ${slotStr}<br>
        <strong>Délka:</strong> ${durationMinutes} min</p>
        <p>Těším se na setkání.<br>Matěj</p>
      `,
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
