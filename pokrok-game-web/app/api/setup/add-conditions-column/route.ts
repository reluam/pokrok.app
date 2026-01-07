import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * One-time endpoint to add conditions column to assistant_tips table
 * 
 * POST /api/setup/add-conditions-column
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Adding conditions column to assistant_tips table...')

    // Check if column already exists
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assistant_tips' 
        AND column_name = 'conditions'
      )
    `

    if (columnExists[0]?.exists) {
      return NextResponse.json({
        success: true,
        message: 'Column conditions already exists in assistant_tips table',
        alreadyExists: true
      })
    }

    // Add conditions column
    await sql`
      ALTER TABLE assistant_tips 
      ADD COLUMN conditions JSONB DEFAULT NULL
    `

    console.log('✓ conditions column added successfully')

    return NextResponse.json({
      success: true,
      message: 'conditions column added successfully to assistant_tips table'
    })
  } catch (error: any) {
    console.error('Error adding conditions column:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add conditions column',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy browser access
export async function GET(request: NextRequest) {
  return POST(request)
}

