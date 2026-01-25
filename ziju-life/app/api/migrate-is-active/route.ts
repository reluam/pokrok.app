import { NextResponse } from 'next/server'
import { sql } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
      return NextResponse.json(
        { 
          error: 'DATABASE_URL is not configured',
          message: 'Please set DATABASE_URL in your .env.local file'
        },
        { status: 500 }
      )
    }

    // Add is_active column if it doesn't exist
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `
    
    // Set all existing items to active by default
    await sql`
      UPDATE inspirations 
      SET is_active = true 
      WHERE is_active IS NULL
    `
    
    return NextResponse.json({ 
      message: 'Migration completed: is_active column added' 
    })
  } catch (error: any) {
    // If column already exists, that's okay
    if (error.message?.includes('already exists') || 
        error.message?.includes('duplicate column')) {
      return NextResponse.json({ 
        message: 'Migration already applied',
        error: error.message 
      })
    }
    
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error.message,
        hint: 'Make sure DATABASE_URL is set correctly in .env.local'
      },
      { status: 500 }
    )
  }
}
