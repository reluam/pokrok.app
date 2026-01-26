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
 * Batch endpoint to load steps for multiple areas at once
 * POST /api/daily-steps/batch
 * Body: { areaIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { areaIds } = body
    
    if (!Array.isArray(areaIds) || areaIds.length === 0) {
      return NextResponse.json({ error: 'areaIds array is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření, že všechny areas patří uživateli
    const areasCheck = await sql`
      SELECT id FROM areas 
      WHERE id = ANY(${areaIds}) AND user_id = ${dbUser.id}
    `
    
    const validAreaIds = areasCheck.map((a: any) => a.id)
    if (validAreaIds.length !== areaIds.length) {
      return NextResponse.json({ error: 'Some areas not found or access denied' }, { status: 403 })
    }

    // ✅ PERFORMANCE: Načíst všechny steps pro všechny areas v jednom dotazu
    const steps = await sql`
      SELECT 
        id, user_id, title, description, completed, 
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        is_important, is_urgent, aspiration_id, area_id,
        estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
        COALESCE(checklist, '[]'::jsonb) as checklist,
        COALESCE(require_checklist_complete, false) as require_checklist_complete
      FROM daily_steps
      WHERE area_id = ANY(${areaIds}) AND user_id = ${dbUser.id}
      ORDER BY area_id, created_at DESC
    `
    
    // Normalize dates
    const normalizedSteps = steps.map((step: any) => ({
      ...step,
      date: normalizeDateFromDB(step.date)
    }))
    
    // Group steps by area_id for easier consumption
    const stepsByArea: Record<string, typeof normalizedSteps> = {}
    normalizedSteps.forEach((step: any) => {
      if (!step.area_id) return // Skip steps without area_id
      if (!stepsByArea[step.area_id]) {
        stepsByArea[step.area_id] = []
      }
      stepsByArea[step.area_id].push(step)
    })
    
    // Ensure all areaIds have an entry (even if empty)
    areaIds.forEach((areaId: string) => {
      if (!stepsByArea[areaId]) {
        stepsByArea[areaId] = []
      }
    })
    
    return NextResponse.json({ stepsByArea })
  } catch (error) {
    console.error('Error fetching batch steps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

