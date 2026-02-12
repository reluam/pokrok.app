import { neon } from '@neondatabase/serverless'

// Use a placeholder connection string during build if DATABASE_URL is not set
const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder@localhost/dummy'
const sql = neon(connectionString)

export async function initializeDatabase() {
  try {
    // Create inspirations table
    await sql`
      CREATE TABLE IF NOT EXISTS inspirations (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('blog', 'video', 'book', 'article', 'other')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        url TEXT,
        author TEXT,
        content TEXT,
        thumbnail TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on type for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_inspirations_type ON inspirations(type)
    `

    // Create index on created_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_inspirations_created_at ON inspirations(created_at DESC)
    `

    // Add image_url for book covers (optional)
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `

    // Create newsletter_subscribers table
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)
    `

    // Create index on created_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON newsletter_subscribers(created_at DESC)
    `

    // Create newsletter_pending_subscriptions table for double opt-in
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_pending_subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on token for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_token ON newsletter_pending_subscriptions(token)
    `

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_email ON newsletter_pending_subscriptions(email)
    `

    // Create index on expires_at for cleanup
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_expires_at ON newsletter_pending_subscriptions(expires_at)
    `

    // Create newsletter_campaigns table for managing newsletter campaigns
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id VARCHAR(255) PRIMARY KEY,
        subject TEXT NOT NULL,
        description TEXT DEFAULT '',
        sections JSONB NOT NULL DEFAULT '[]'::jsonb,
        content TEXT DEFAULT '',
        scheduled_at TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Migrate old content column if it exists with NOT NULL constraint
    try {
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content DROP NOT NULL
      `
    } catch (e) {
      // Constraint might not exist, ignore
    }
    
    try {
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content SET DEFAULT ''
      `
    } catch (e) {
      // Column might not exist, ignore
    }
    
    // Add new columns if they don't exist
    await sql`
      ALTER TABLE newsletter_campaigns 
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''
    `
    
    await sql`
      ALTER TABLE newsletter_campaigns 
      ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb
    `

    // Create index on status for filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON newsletter_campaigns(status)
    `

    // Create index on scheduled_at for finding campaigns to send
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON newsletter_campaigns(scheduled_at)
    `

    // Create index on created_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON newsletter_campaigns(created_at DESC)
    `

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export { sql }
