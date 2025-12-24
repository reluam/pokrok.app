import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Ensure important_steps_planning table exists
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS important_steps_planning (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        step_id TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('important', 'other', 'backlog')),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, date, step_id)
      )
    `
  } catch (error: any) {
    // Table might already exist, that's okay
    if (!error.message?.includes('already exists')) {
      console.error('Error creating important_steps_planning table:', error)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure table exists first
    await ensureTableExists()
    
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if view is enabled (now it's a view, not a workflow)
    // We check view_settings for visible_in_navigation instead of workflows table
    // Default to enabled if settings don't exist
    let isViewEnabled = true
    
    try {
      const viewSettings = await sql`
        SELECT visible_sections FROM view_settings 
        WHERE user_id = ${dbUser.id} AND view_type = 'only_the_important'
        LIMIT 1
      `

      // View is enabled if visible_in_navigation is not false (defaults to true)
      if (viewSettings.length > 0) {
        isViewEnabled = viewSettings[0]?.visible_sections?._visible_in_navigation !== false
      }
    } catch (error) {
      // If view_settings table doesn't exist or query fails, assume enabled (default behavior)
      console.log('Could not check view settings, assuming enabled:', error)
    }

    if (!isViewEnabled) {
      return NextResponse.json({ 
        needs_planning: false, 
        last_planned_date: null,
        workflow_enabled: false
      })
    }

    // Get today's date (use local date to avoid timezone issues)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    // Check if user has completed planning for today
    const todayPlanning = await sql`
      SELECT COUNT(*) as count FROM important_steps_planning 
      WHERE user_id = ${dbUser.id} AND date = ${todayStr}
    `

    const hasTodayPlanning = parseInt(todayPlanning[0]?.count || '0') > 0

    // Get last planned date
    const lastPlanned = await sql`
      SELECT MAX(date) as last_date FROM important_steps_planning 
      WHERE user_id = ${dbUser.id}
    `

    const lastPlannedDate = lastPlanned[0]?.last_date || null

    // User needs planning if:
    // 1. Workflow is enabled
    // 2. Today's planning doesn't exist (or it's a new day after midnight)
    const needsPlanning = !hasTodayPlanning

    return NextResponse.json({
      needs_planning: needsPlanning,
      last_planned_date: lastPlannedDate,
      workflow_enabled: true,
      today: todayStr,
      has_today_planning: hasTodayPlanning
    })
  } catch (error: any) {
    console.error('Error checking important steps planning:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

