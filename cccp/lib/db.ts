import { neon } from "@neondatabase/serverless";

// Use a placeholder connection string during build if DATABASE_URL is not set
const connectionString =
  process.env.DATABASE_URL || "postgresql://placeholder@localhost/dummy";

export const sql = neon(connectionString);

export async function initializeCoachCrmDatabase() {
  try {
    // leads (soft delete: deleted_at set = removed, restorable within 48h)
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'novy',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `;
    await sql`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
    `;

    // Relax older CHECK constraints on status if they exist
    try {
      await sql`ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check`;
    } catch (e) {
      // ignore – constraint name might differ on fresh DB
    }

    await sql`
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at)
    `;

    // clients
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        lead_id TEXT REFERENCES leads(id),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        tags JSONB DEFAULT '[]'::jsonb,
        main_goal TEXT,
        status TEXT NOT NULL DEFAULT 'aktivni',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Add status column on existing DBs if needed
    await sql`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktivni'
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_lead_id
      ON clients(lead_id)
      WHERE lead_id IS NOT NULL
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC)
    `;

    // sessions (meetings)
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id),
        title TEXT NOT NULL,
        template_id TEXT,
        scheduled_at TIMESTAMPTZ,
        duration_minutes INTEGER,
        calendar_provider TEXT CHECK (calendar_provider IN ('google', 'caleu')),
        calendar_event_id TEXT,
        notes TEXT,
        key_points TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at)
    `;
    // Allow sessions without client (coach can add sessions directly)
    try {
      await sql`ALTER TABLE sessions ALTER COLUMN client_id DROP NOT NULL`;
    } catch (e) {
      // Column might already be nullable
    }
    // Add user_id to sessions for sessions without client
    await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
    // Backfill user_id from clients for existing sessions
    try {
      await sql`
        UPDATE sessions s
        SET user_id = c.user_id
        FROM clients c
        WHERE s.client_id = c.id AND s.user_id IS NULL
      `;
    } catch (e) {
      // Ignore if fails
    }

    // session_templates (per user)
    await sql`
      CREATE TABLE IF NOT EXISTS session_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        structure JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE session_templates ADD COLUMN IF NOT EXISTS user_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_templates_user_id ON session_templates(user_id)`;

    // payments
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id),
        amount NUMERIC(10, 2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'CZK',
        paid_at TIMESTAMPTZ NOT NULL,
        method TEXT,
        note TEXT
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC)
    `;

    // weekly_availability (repeating weekly windows for booking slots, per coach)
    await sql`
      CREATE TABLE IF NOT EXISTS weekly_availability (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE weekly_availability ADD COLUMN IF NOT EXISTS user_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_weekly_availability_user_id ON weekly_availability(user_id)`;

    // bookings (discovery-call style, no client yet; per coach, optional source)
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        scheduled_at TIMESTAMPTZ NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        lead_id TEXT REFERENCES leads(id),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        source TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id TEXT`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`;

    // clients (per coach)
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id)`;

    // calendar_connections (OAuth tokens for Google Calendar)
    await sql`
      CREATE TABLE IF NOT EXISTS calendar_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'google',
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMPTZ,
        calendar_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_connections_user_provider
      ON calendar_connections(user_id, provider)
    `;

    // user_calendars (multiple Google calendars per user for slot blocking)
    await sql`
      CREATE TABLE IF NOT EXISTS user_calendars (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'google',
        calendar_id TEXT NOT NULL,
        label TEXT,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id)`;

    // user_booking_slug (for public URL /book/[slug]/[eventSlug])
    await sql`
      CREATE TABLE IF NOT EXISTS user_booking_slug (
        user_id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_booking_slug_slug ON user_booking_slug(slug)`;

    // user_settings (e.g. first day of week for booking calendar: 0=Sunday, 1=Monday)
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        first_day_of_week INTEGER NOT NULL DEFAULT 1,
        use_integrated_calendars BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS use_integrated_calendars BOOLEAN NOT NULL DEFAULT true`;

    // events (bookable event types: name, duration, min advance booking, per-user)
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        name TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        min_advance_minutes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS min_advance_minutes INTEGER NOT NULL DEFAULT 0`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_events_user_slug ON events(user_id, slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`;

    // event_availability (weekly windows per event)
    await sql`
      CREATE TABLE IF NOT EXISTS event_availability (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_event_availability_event_id ON event_availability(event_id)`;

    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id)`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS note TEXT`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ`;

    console.log("Coach CRM database initialized successfully");
  } catch (error) {
    console.error("Error initializing Coach CRM database:", error);
    throw error;
  }
}

