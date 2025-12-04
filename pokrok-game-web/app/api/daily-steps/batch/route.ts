import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Helper function to normalize date from database to YYYY-MM-DD string
function normalizeDateFromDB(date: any): string | null {
  if (!date) return null
  
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date
  }
  
  if (typeof date === 'string' && date.includes('T')) {
    const datePart = date.split('T')[0]
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return datePart
    }
  }
  
  if (date instanceof Date || (typeof date === 'object' && 'getTime' in date)) {
    const d = new Date(date)
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return null
}

/**
 * Batch endpoint to load steps for multiple goals at once
 * POST /api/daily-steps/batch
 * Body: { goalIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { goalIds } = body
    
    if (!Array.isArray(goalIds) || goalIds.length === 0) {
      return NextResponse.json({ error: 'goalIds array is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření, že všechny goals patří uživateli
    const goalsCheck = await sql`
      SELECT id FROM goals 
      WHERE id = ANY(${goalIds}) AND user_id = ${dbUser.id}
    `
    
    const validGoalIds = goalsCheck.map((g: any) => g.id)
    if (validGoalIds.length !== goalIds.length) {
      return NextResponse.json({ error: 'Some goals not found or access denied' }, { status: 403 })
    }

    // ✅ PERFORMANCE: Načíst všechny steps pro všechny goals v jednom dotazu
    const steps = await sql`
      SELECT 
        id, user_id, goal_id, title, description, completed, 
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        is_important, is_urgent, aspiration_id, area_id,
        estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
        COALESCE(checklist, '[]'::jsonb) as checklist,
        COALESCE(require_checklist_complete, false) as require_checklist_complete
      FROM daily_steps
      WHERE goal_id = ANY(${goalIds}) AND user_id = ${dbUser.id}
      ORDER BY goal_id, created_at DESC
    `
    
    // Normalize dates
    const normalizedSteps = steps.map((step: any) => ({
      ...step,
      date: normalizeDateFromDB(step.date)
    }))
    
    // Group steps by goal_id for easier consumption
    const stepsByGoal: Record<string, typeof normalizedSteps> = {}
    normalizedSteps.forEach((step: any) => {
      if (!stepsByGoal[step.goal_id]) {
        stepsByGoal[step.goal_id] = []
      }
      stepsByGoal[step.goal_id].push(step)
    })
    
    // Ensure all goalIds have an entry (even if empty)
    goalIds.forEach((goalId: string) => {
      if (!stepsByGoal[goalId]) {
        stepsByGoal[goalId] = []
      }
    })
    
    return NextResponse.json({ stepsByGoal })
  } catch (error) {
    console.error('Error fetching batch steps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

