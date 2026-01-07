import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * One-time endpoint to add is_admin column to users table
 * Can be called manually once to add the column to existing databases
 * 
 * POST /api/setup/add-admin-column
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Adding is_admin column to users table...')

    // Check if column already exists
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_admin'
      )
    `

    if (columnExists[0]?.exists) {
      return NextResponse.json({
        success: true,
        message: 'Column is_admin already exists in users table',
        alreadyExists: true
      })
    }

    // Add is_admin column
    await sql`
      ALTER TABLE users 
      ADD COLUMN is_admin BOOLEAN DEFAULT FALSE
    `

    console.log('✓ is_admin column added successfully')

    return NextResponse.json({
      success: true,
      message: 'is_admin column added successfully to users table'
    })
  } catch (error: any) {
    console.error('Error adding is_admin column:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add is_admin column',
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

