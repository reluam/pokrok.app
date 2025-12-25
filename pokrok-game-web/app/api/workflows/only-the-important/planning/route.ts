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
    await ensureTableExists()
    
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    // Use local date as default to avoid timezone issues
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const defaultDate = `${year}-${month}-${day}`
    const date = dateParam || defaultDate

    // Get view settings (now it's a view, not a workflow)
    // Check view_configurations for settings (optional - if not found, use defaults)
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
      console.log('Could not load view configuration, using defaults:', error)
    }

    // Get planning data for this date
    const planning = await sql`
      SELECT * FROM important_steps_planning 
      WHERE user_id = ${dbUser.id} AND date = ${date}
      ORDER BY category, order_index ASC
    `

    // Group by category
    const importantSteps: any[] = []
    const otherSteps: any[] = []
    const backlogSteps: any[] = []

    for (const item of planning) {
      // Get step details
      const stepResult = await sql`
        SELECT * FROM daily_steps 
        WHERE id = ${item.step_id} AND user_id = ${dbUser.id}
        LIMIT 1
      `
      
      if (stepResult.length > 0) {
        const step = { ...stepResult[0], planning_id: item.id, order_index: item.order_index }
        if (item.category === 'important') {
          importantSteps.push(step)
        } else if (item.category === 'other') {
          otherSteps.push(step)
        } else {
          backlogSteps.push(step)
        }
      }
    }

    // Get all available steps (today, overdue, future) that are not yet in planning
    const planningDate = new Date(date)
    planningDate.setHours(0, 0, 0, 0)
    const planningDateStr = planningDate.toISOString().split('T')[0]
    
    const plannedStepIds = planning.map(p => p.step_id)

    // Get steps for today, overdue, and future (next 30 days)
    const startDate = new Date(planningDate)
    startDate.setDate(startDate.getDate() - 7) // Include overdue (7 days back)
    const endDate = new Date(planningDate)
    endDate.setDate(endDate.getDate() + 30) // Include future (30 days ahead)

    // Get available steps, excluding those already in planning
    let availableSteps
    if (plannedStepIds.length > 0) {
      availableSteps = await sql`
        SELECT * FROM daily_steps 
        WHERE user_id = ${dbUser.id} 
          AND date >= ${startDate.toISOString().split('T')[0]} 
          AND date <= ${endDate.toISOString().split('T')[0]}
          AND completed = false
          AND id != ALL(${plannedStepIds})
        ORDER BY date ASC, created_at ASC
      `
    } else {
      availableSteps = await sql`
        SELECT * FROM daily_steps 
        WHERE user_id = ${dbUser.id} 
          AND date >= ${startDate.toISOString().split('T')[0]} 
          AND date <= ${endDate.toISOString().split('T')[0]}
          AND completed = false
        ORDER BY date ASC, created_at ASC
      `
    }

    // Combine backlog_steps and available_steps into one backlog list
    const allBacklogSteps = [...backlogSteps, ...availableSteps]

    return NextResponse.json({
      important_steps: importantSteps,
      other_steps: otherSteps,
      backlog_steps: allBacklogSteps,
      available_steps: [], // Keep for backward compatibility, but empty
      settings: {
        important_steps_count: importantStepsCount
      },
      date
    })
  } catch (error) {
    console.error('Error fetching important steps planning:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTableExists()
    
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { date, steps } = body

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    if (!Array.isArray(steps)) {
      return NextResponse.json({ error: 'Steps must be an array' }, { status: 400 })
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

    // Validate important steps count
    const importantSteps = steps.filter((s: any) => s.category === 'important')
    if (importantSteps.length > importantStepsCount) {
      return NextResponse.json({ 
        error: `Maximum ${importantStepsCount} important steps allowed` 
      }, { status: 400 })
    }

    // Delete existing planning for this date
    await sql`
      DELETE FROM important_steps_planning 
      WHERE user_id = ${dbUser.id} AND date = ${date}
    `

    // Insert new planning
    if (steps.length > 0) {
      const values = steps.map((step: any, index: number) => ({
        user_id: dbUser.id,
        date,
        step_id: step.step_id,
        category: step.category,
        order_index: step.order_index !== undefined ? step.order_index : index
      }))

      for (const value of values) {
        await sql`
          INSERT INTO important_steps_planning (user_id, date, step_id, category, order_index)
          VALUES (${value.user_id}, ${value.date}, ${value.step_id}, ${value.category}, ${value.order_index})
          ON CONFLICT (user_id, date, step_id) 
          DO UPDATE SET category = ${value.category}, order_index = ${value.order_index}, updated_at = NOW()
        `
      }
    }

    // If step is moved to "other", update its date to the planning date
    const otherStepIds = steps
      .filter((s: any) => s.category === 'other')
      .map((s: any) => s.step_id)

    if (otherStepIds.length > 0) {
      await sql`
        UPDATE daily_steps 
        SET date = ${date}, updated_at = NOW()
        WHERE user_id = ${dbUser.id} AND id = ANY(${otherStepIds})
      `
    }

    return NextResponse.json({ success: true, date })
  } catch (error) {
    console.error('Error saving important steps planning:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

