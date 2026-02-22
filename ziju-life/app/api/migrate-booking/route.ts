import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured" },
        { status: 500 }
      );
    }

    await sql`
      CREATE TABLE IF NOT EXISTS booking_slots (
        id VARCHAR(255) PRIMARY KEY,
        start_at TIMESTAMP WITH TIME ZONE NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_booking_slots_start_at ON booking_slots(start_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        lead_id VARCHAR(255) NOT NULL REFERENCES leads(id),
        slot_id VARCHAR(255) NOT NULL REFERENCES booking_slots(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id)`;
    try {
      await sql`ALTER TABLE bookings ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE`;
    } catch { /* column may already exist */ }

    await sql`
      CREATE TABLE IF NOT EXISTS weekly_availability (
        id VARCHAR(255) PRIMARY KEY,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_weekly_availability_day ON weekly_availability(day_of_week)`;

    return NextResponse.json({
      message: "Migration completed: booking_slots, bookings and weekly_availability tables created",
    });
  } catch (error: unknown) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
