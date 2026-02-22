import { NextResponse } from 'next/server'
import { sql } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
      return NextResponse.json(
        { error: 'DATABASE_URL is not configured' },
        { status: 500 }
      )
    }

    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        source VARCHAR(100) NOT NULL DEFAULT 'koucing',
        status VARCHAR(50) NOT NULL DEFAULT 'novy' CHECK (status IN ('novy', 'kontaktovan', 'rezervovano', 'odmitnuto')),
        message TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)
    `

    await sql`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS clickup_task_id TEXT
    `

    return NextResponse.json({ message: 'Migration completed: leads table created' })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}
