import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    try {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const today = now.toISOString().split('T')[0]

      // Get enabled workflows
      const allWorkflows = await sql`
        SELECT * FROM workflows 
        WHERE user_id = ${userId}
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

