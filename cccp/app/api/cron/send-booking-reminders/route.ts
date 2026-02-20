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

    // Get event names for bookings with event_id
    const eventIds = bookings
      .map((b) => b.event_id)
      .filter((id): id is string => id !== null);
    const eventMap = new Map<string, string>();
    if (eventIds.length > 0) {
      const events = await sql`
        SELECT id, name FROM events WHERE id = ANY(${eventIds})
      ` as Array<{ id: string; name: string }>;
      events.forEach((e) => eventMap.set(e.id, e.name));
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        const eventName = booking.event_id ? eventMap.get(booking.event_id) : undefined;
        const result = await sendBookingReminder({
          to: booking.email,
          name: booking.name,
          scheduledAt: booking.scheduled_at,
          durationMinutes: booking.duration_minutes,
          eventName,
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
