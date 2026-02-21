import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { sendBookingReminder } from "../../../../lib/email";

/**
 * Cron endpoint for sending booking reminders 24 hours before scheduled time.
 * Should be called hourly (e.g., via cron-job.org).
 *
 * Security: In production, add authentication (e.g., secret token in query param or header).
 */
export async function GET(request: NextRequest) {
  // Optional: Add secret token check for security
  const authToken = request.nextUrl.searchParams.get("token");
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  if (expectedToken && authToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find bookings scheduled between 24h and 25h from now
    // (1 hour window to account for cron timing)
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const bookings = await sql`
      SELECT 
        id,
        email,
        name,
        scheduled_at,
        duration_minutes,
        event_id,
        status
      FROM bookings
      WHERE scheduled_at >= ${in24Hours.toISOString()}
        AND scheduled_at < ${in25Hours.toISOString()}
        AND status IN ('pending', 'confirmed')
        AND reminder_sent_at IS NULL
      ORDER BY scheduled_at ASC
    ` as Array<{
      id: string;
      email: string;
      name: string;
      scheduled_at: string;
      duration_minutes: number;
      event_id: string | null;
      status: string;
    }>;

    if (bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No bookings to remind",
        sent: 0,
      });
    }

    // Get event names and project logos for bookings with event_id
    const eventIds = bookings
      .map((b) => b.event_id)
      .filter((id): id is string => id !== null);
    const eventMap = new Map<string, string>();
    const eventProjectIdMap = new Map<string, string | null>();
    if (eventIds.length > 0) {
      const events = await sql`
        SELECT id, name, project_id FROM events WHERE id = ANY(${eventIds})
      ` as Array<{ id: string; name: string; project_id: string | null }>;
      events.forEach((e) => {
        eventMap.set(e.id, e.name);
        eventProjectIdMap.set(e.id, e.project_id);
      });
    }
    const projectIds = [...new Set(eventProjectIdMap.values())].filter((id): id is string => id != null);
    const projectLogoMap = new Map<string, string>();
    if (projectIds.length > 0) {
      const projects = await sql`
        SELECT id, logo_url FROM projects WHERE id = ANY(${projectIds}) AND logo_url IS NOT NULL AND trim(logo_url) != ''
      ` as Array<{ id: string; logo_url: string | null }>;
      projects.forEach((p) => {
        const url = p.logo_url?.trim();
        if (url && url.startsWith("http")) projectLogoMap.set(p.id, url);
      });
    }
    const eventLogoMap = new Map<string, string>();
    eventProjectIdMap.forEach((projectId, eventId) => {
      if (projectId && projectLogoMap.has(projectId)) {
        eventLogoMap.set(eventId, projectLogoMap.get(projectId)!);
      }
    });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        const eventName = booking.event_id ? eventMap.get(booking.event_id) : undefined;
        const logoUrl = booking.event_id ? eventLogoMap.get(booking.event_id) : undefined;
        const result = await sendBookingReminder({
          to: booking.email,
          name: booking.name,
          scheduledAt: booking.scheduled_at,
          durationMinutes: booking.duration_minutes,
          eventName,
          logoUrl,
        });

        if (result.success) {
          // Mark reminder as sent
          await sql`
            UPDATE bookings
            SET reminder_sent_at = NOW()
            WHERE id = ${booking.id}
          `;
          sent++;
        } else {
          failed++;
          errors.push(`Booking ${booking.id}: ${result.error || "Unknown error"}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Booking ${booking.id}: ${(error as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${bookings.length} bookings`,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in send-booking-reminders cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
