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
  coachName?: string;
  primaryContactDisplay?: string;
  logoUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log(`[Email] sendBookingConfirmation called for ${params.to}`);
  
  if (!resend) {
    const errorMsg = "Resend client not initialized - missing RESEND_API_KEY";
    console.error(`[Email] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  console.log(`[Email] Resend client OK, proceeding with email send`);
  
  try {
    const html = renderBookingConfirmationEmail({
      name: params.name,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      eventName: params.eventName,
      note: params.note,
      coachName: params.coachName,
      primaryContactDisplay: params.primaryContactDisplay,
      logoUrl: params.logoUrl,
    });

    const fromEmail = formatFromEmail("Potvrzení schůzky");
    console.log(`[Email] Sending confirmation to ${params.to} from ${fromEmail}`);
    console.log(`[Email] Resend client initialized:`, !!resend);
    console.log(`[Email] About to call resend.emails.send...`);
    console.log(`[Email] Resend API key present:`, !!process.env.RESEND_API_KEY);
    console.log(`[Email] Resend API key length:`, process.env.RESEND_API_KEY?.length || 0);
    
    let result;
    try {
      const emailPayload = {
        from: fromEmail,
        to: params.to,
        subject: `Rezervace potvrzena - ${params.eventName || "Konzultace"}`,
        html,
      };
      console.log(`[Email] Calling resend.emails.send with payload:`, JSON.stringify({ ...emailPayload, html: html.substring(0, 100) + "..." }));
      
      // Try SDK first, fallback to direct API call if SDK hangs
      try {
        result = await Promise.race([
          resend.emails.send(emailPayload),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("SDK timeout")), 5000)
          )
        ]) as Awaited<ReturnType<typeof resend.emails.send>>;
        console.log(`[Email] resend.emails.send completed via SDK`);
      } catch (sdkError) {
        console.warn(`[Email] SDK call failed or timed out, trying direct API call:`, (sdkError as Error).message);
        // Fallback to direct API call
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          throw new Error("RESEND_API_KEY not available for fallback");
        }
        
        const fetchResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });
        
        const fetchData = await fetchResponse.json();
        
        if (!fetchResponse.ok) {
          result = { error: { message: fetchData.message || "Unknown error", name: "ResendAPIError" }, data: null };
        } else {
          result = { error: null, data: fetchData };
        }
        console.log(`[Email] Direct API call completed, status: ${fetchResponse.status}`);
      }
      
      console.log(`[Email] Final result type:`, typeof result);
      console.log(`[Email] result keys:`, result ? Object.keys(result) : "null");
      console.log(`[Email] result.error:`, result.error);
      console.log(`[Email] result.data:`, result.data);
    } catch (sendError) {
      console.error(`[Email] Exception during resend.emails.send:`, sendError);
      console.error(`[Email] Error details:`, {
        message: (sendError as Error).message,
        stack: (sendError as Error).stack,
        name: (sendError as Error).name,
      });
      throw sendError;
    }

    console.log(`[Email] Resend API response:`, JSON.stringify({ 
      hasError: !!result.error, 
      hasData: !!result.data,
      error: result.error ? { message: result.error.message, name: result.error.name } : null,
      emailId: result.data?.id || null
    }));

    if (result.error) {
      console.error("[Email] Error sending booking confirmation:", result.error);
      return { success: false, error: result.error.message || JSON.stringify(result.error) };
    }

    console.log(`[Email] Confirmation sent successfully to ${params.to}, email ID: ${result.data?.id || "unknown"}`);
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
  logoUrl?: string;
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
      logoUrl: params.logoUrl,
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
    const errorMsg = "Resend client not initialized - missing RESEND_API_KEY";
    console.error(errorMsg);
    return { success: false, error: errorMsg };
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

    const fromEmail = formatFromEmail("Nová rezervace");
    console.log(`[Email] Sending coach notification to ${params.coachEmail} from ${fromEmail}`);
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: params.coachEmail,
      replyTo: params.clientEmail,
      subject: `Nová rezervace - ${params.clientName}`,
      html,
    });

    if (result.error) {
      console.error("[Email] Error sending coach notification:", result.error);
      return { success: false, error: result.error.message || JSON.stringify(result.error) };
    }

    console.log(`[Email] Coach notification sent successfully to ${params.coachEmail}, email ID: ${result.data?.id || "unknown"}`);
    return { success: true };
  } catch (error) {
    console.error("Exception sending coach notification:", error);
    return { success: false, error: (error as Error).message };
  }
}
