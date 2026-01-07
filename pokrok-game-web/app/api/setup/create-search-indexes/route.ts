import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * One-time endpoint to create search indexes for assistant search optimization
 * Can be called manually once to set up indexes on existing databases
 * 
 * POST /api/setup/create-search-indexes
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Creating assistant search indexes...')

    // Indexes for daily_steps (title and description search)
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_title_search ON daily_steps(user_id, title text_pattern_ops)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_description_search ON daily_steps(user_id, description text_pattern_ops)`
    
    // Indexes for goals (title and description search)
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_title_search ON goals(user_id, title text_pattern_ops)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_description_search ON goals(user_id, description text_pattern_ops)`
    
    // Indexes for areas (name and description search)
    await sql`CREATE INDEX IF NOT EXISTS idx_areas_user_name_search ON areas(user_id, name text_pattern_ops)`
    await sql`CREATE INDEX IF NOT EXISTS idx_areas_user_description_search ON areas(user_id, description text_pattern_ops)`
    
    // Indexes for habits (name and description search)
    await sql`CREATE INDEX IF NOT EXISTS idx_habits_user_name_search ON habits(user_id, name text_pattern_ops)`
    await sql`CREATE INDEX IF NOT EXISTS idx_habits_user_description_search ON habits(user_id, description text_pattern_ops)`

    console.log('✓ Assistant search indexes created/verified successfully')

    return NextResponse.json({
      success: true,
      message: 'Search indexes created/verified successfully',
      indexes: [
        'idx_daily_steps_user_title_search',
        'idx_daily_steps_user_description_search',
        'idx_goals_user_title_search',
        'idx_goals_user_description_search',
        'idx_areas_user_name_search',
        'idx_areas_user_description_search',
        'idx_habits_user_name_search',
        'idx_habits_user_description_search'
      ]
    })
  } catch (error: any) {
    console.error('Error creating search indexes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create search indexes',
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

