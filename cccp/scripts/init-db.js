// Simple script to initialize database
// Run with: node scripts/init-db.js
// Or: npm run db:init
//
// Note: Make sure .env.local exists with DATABASE_URL

const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

const { neon } = require("@neondatabase/serverless");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL není nastaven v .env.local");
  process.exit(1);
}

const sql = neon(connectionString);

async function initializeCoachCrmDatabase() {
  try {
    // leads
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'novy',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    try {
      await sql`ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check`;
    } catch (e) {
      // ignore
    }

    await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`;

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

    await sql`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktivni'
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_lead_id
      ON clients(lead_id)
      WHERE lead_id IS NOT NULL
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC)`;

    // sessions
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

    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at)`;

    // session_templates
    await sql`
      CREATE TABLE IF NOT EXISTS session_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        structure JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

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

    await sql`CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC)`;

    // weekly_availability (NEW)
    await sql`
      CREATE TABLE IF NOT EXISTS weekly_availability (
        id TEXT PRIMARY KEY,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // bookings (NEW)
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        scheduled_at TIMESTAMPTZ NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        lead_id TEXT REFERENCES leads(id),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`;

    console.log("✓ Databáze úspěšně inicializována!");
  } catch (error) {
    console.error("✗ Chyba při inicializaci:", error);
    throw error;
  }
}

initializeCoachCrmDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
