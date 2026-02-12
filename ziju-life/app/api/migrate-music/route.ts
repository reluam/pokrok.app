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

    // Add is_current_listening column for music
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS is_current_listening BOOLEAN DEFAULT false
    `

    // Update CHECK constraint: drop existing, add new with 'music'
    await sql`ALTER TABLE inspirations DROP CONSTRAINT IF EXISTS inspirations_type_check`
    await sql`
      ALTER TABLE inspirations 
      ADD CONSTRAINT inspirations_type_check 
      CHECK (type IN ('blog', 'video', 'book', 'article', 'other', 'music'))
    `

    return NextResponse.json({ message: 'Migration completed: music type added' })
  } catch (error: any) {
    if (error.code === '42710' || error.message?.includes('already exists')) {
      return NextResponse.json({ message: 'Migration already applied' })
    }
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}
