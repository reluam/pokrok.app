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

export async function PUT(request: NextRequest) {
  try {
    await ensureTableExists()
    
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { step_id, date, from_category, to_category, order_index } = body

    if (!step_id || !date || !to_category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['important', 'other', 'backlog'].includes(to_category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Get view settings to validate important steps count (optional - if not found, use defaults)
    let importantStepsCount = 3
    
    try {
      const viewConfig = await sql`
        SELECT settings FROM view_configurations 
        WHERE user_id = ${dbUser.id} AND workflow_key = 'only_the_important' AND enabled = true
        LIMIT 1
      `

      if (viewConfig.length > 0 && viewConfig[0].settings) {
        const settings = viewConfig[0].settings as { workflowSettings?: { important_steps_count?: number } } || {}
        importantStepsCount = settings.workflowSettings?.important_steps_count || 3
      }
    } catch (error) {
      // If view_configurations table doesn't exist or query fails, use default
      console.log('Could not load view configuration for validation, using defaults:', error)
    }

    // If moving to "important", check count
    if (to_category === 'important') {
      const currentImportant = await sql`
        SELECT COUNT(*) as count FROM important_steps_planning 
        WHERE user_id = ${dbUser.id} AND date = ${date} AND category = 'important'
      `
      const currentCount = parseInt(currentImportant[0]?.count || '0')
      
      // If not moving from important, check if we're adding a new one
      if (from_category !== 'important' && currentCount >= importantStepsCount) {
        return NextResponse.json({ 
          error: `Maximum ${importantStepsCount} important steps allowed` 
        }, { status: 400 })
      }
    }

    // Check if step exists in planning
    const existing = await sql`
      SELECT * FROM important_steps_planning 
      WHERE user_id = ${dbUser.id} AND step_id = ${step_id} AND date = ${date}
      LIMIT 1
    `

    if (existing.length > 0) {
      // Update existing
      await sql`
        UPDATE important_steps_planning 
        SET category = ${to_category}, 
            order_index = ${order_index !== undefined ? order_index : existing[0].order_index},
            updated_at = NOW()
        WHERE user_id = ${dbUser.id} AND step_id = ${step_id} AND date = ${date}
      `
    } else {
      // Insert new
      await sql`
        INSERT INTO important_steps_planning (user_id, date, step_id, category, order_index)
        VALUES (${dbUser.id}, ${date}, ${step_id}, ${to_category}, ${order_index || 0})
      `
    }

    // If moving to "other", update step date to planning date
    if (to_category === 'other') {
      await sql`
        UPDATE daily_steps 
        SET date = ${date}, updated_at = NOW()
        WHERE user_id = ${dbUser.id} AND id = ${step_id}
      `
    }

    // If moving from "other" to something else, we might want to revert the date
    // But for now, we'll keep the date as is

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error moving step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

