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

    // Alter table to make url nullable
    await sql`
      ALTER TABLE inspirations 
      ALTER COLUMN url DROP NOT NULL
    `
    
    return NextResponse.json({ 
      message: 'Migration completed: url column is now nullable' 
    })
  } catch (error: any) {
    // If column is already nullable or table doesn't exist, that's okay
    if (error.message?.includes('does not exist') || 
        error.message?.includes('already') ||
        error.message?.includes('column "url" is not of type')) {
      return NextResponse.json({ 
        message: 'Migration already applied or not needed',
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
