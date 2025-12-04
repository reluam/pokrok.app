import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const today = now.toISOString().split('T')[0]

      // Get enabled workflows
      const allWorkflows = await sql`
        SELECT * FROM workflows 
        WHERE user_id = ${targetUserId}
          AND enabled = true
          AND (completed_at IS NULL OR DATE(completed_at) != ${today})
        ORDER BY trigger_time ASC
      `

      // Filter workflows where trigger time has passed today
      const workflows = allWorkflows.filter((wf: any) => {
        if (!wf.trigger_time) return false
        
        const [triggerHour, triggerMinute] = wf.trigger_time.split(':').map(Number)
        const triggerTimeInMinutes = triggerHour * 60 + triggerMinute
        const currentTimeInMinutes = currentHour * 60 + currentMinute
        
        // Show if trigger time has passed today
        return triggerTimeInMinutes <= currentTimeInMinutes
      })
      
      return NextResponse.json(workflows)
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      throw error
    }
  } catch (error) {
    console.error('Error fetching pending workflows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

