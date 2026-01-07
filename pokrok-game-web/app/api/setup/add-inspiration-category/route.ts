import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * One-time endpoint to add 'inspiration' category to assistant_tips table
 * This updates the CHECK constraint to include 'inspiration'
 * 
 * POST /api/setup/add-inspiration-category
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Adding inspiration category to assistant_tips table...')

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assistant_tips'
      )
    `

    if (!tableExists[0]?.exists) {
      return NextResponse.json({
        success: false,
        message: 'assistant_tips table does not exist'
      }, { status: 404 })
    }

    // Drop the old constraint and add a new one with inspiration
    // Note: PostgreSQL doesn't support ALTER CHECK constraint, so we need to drop and recreate
    try {
      await sql`
        ALTER TABLE assistant_tips 
        DROP CONSTRAINT IF EXISTS assistant_tips_category_check
      `
    } catch (error: any) {
      // Constraint might not exist or have different name, continue
      console.log('Could not drop old constraint:', error?.message)
    }

    // Add new constraint with inspiration
    await sql`
      ALTER TABLE assistant_tips 
      ADD CONSTRAINT assistant_tips_category_check 
      CHECK (category IN ('motivation', 'organization', 'productivity', 'feature', 'onboarding', 'inspiration'))
    `

    console.log('✓ inspiration category added successfully')

    return NextResponse.json({
      success: true,
      message: 'inspiration category added successfully to assistant_tips table'
    })
  } catch (error: any) {
    console.error('Error adding inspiration category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add inspiration category',
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

