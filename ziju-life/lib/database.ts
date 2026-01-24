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

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export { sql }
