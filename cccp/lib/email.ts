import { Resend } from "resend";
import {
  renderBookingConfirmationEmail,
  renderBookingReminderEmail,
  renderCoachNotificationEmail,
} from "./email-templates";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL_BASE = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function formatFromEmail(name: string): string {
  return `${name} <${FROM_EMAIL_BASE}>`;
}

export async function sendBookingConfirmation(params: {
  to: string;
  name: string;
  scheduledAt: string;
  durationMinutes: number;
  eventName?: string;
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: "Resend client not initialized" };
  }

  try {
    const html = renderBookingConfirmationEmail({
      name: params.name,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      eventName: params.eventName,
      note: params.note,
    });

    const result = await resend.emails.send({
      from: formatFromEmail("Potvrzení schůzky"),
      to: params.to,
      subject: `Rezervace potvrzena - ${params.eventName || "Konzultace"}`,
      html,
    });

    if (result.error) {
      console.error("Error sending booking confirmation:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception sending booking confirmation:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendBookingReminder(params: {
  to: string;
  name: string;
  scheduledAt: string;
  durationMinutes: number;
  eventName?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: "Resend client not initialized" };
  }

  try {
    const html = renderBookingReminderEmail({
      name: params.name,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      eventName: params.eventName,
    });

    const result = await resend.emails.send({
      from: formatFromEmail("Připomínka schůzky"),
      to: params.to,
      subject: `Připomínka rezervace - ${params.eventName || "Konzultace"}`,
      html,
    });

    if (result.error) {
      console.error("Error sending booking reminder:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception sending booking reminder:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendCoachNotification(params: {
  coachEmail: string;
  clientName: string;
  clientEmail: string;
  scheduledAt: string;
  durationMinutes: number;
  eventName?: string;
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: "Resend client not initialized" };
  }

  try {
    const html = renderCoachNotificationEmail({
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      eventName: params.eventName,
      note: params.note,
    });

    const result = await resend.emails.send({
      from: formatFromEmail("Nová rezervace"),
      to: params.coachEmail,
      replyTo: params.clientEmail,
      subject: `Nová rezervace - ${params.clientName}`,
      html,
    });

    if (result.error) {
      console.error("Error sending coach notification:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception sending coach notification:", error);
    return { success: false, error: (error as Error).message };
  }
}
