import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { isStepScheduledForDay } from '@/app/[locale]/planner/components/utils/stepHelpers'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export const dynamic = 'force-dynamic'

// Helper function to create instance from recurring step
async function createRecurringStepInstance(recurringStep: any, targetDate: Date, userId: string): Promise<void> {
  const dateStr = targetDate.toISOString().split('T')[0]
  const dateFormatted = targetDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
  const instanceTitle = `${recurringStep.title} - ${dateFormatted}`
  
  // Check if instance already exists
  const existingInstance = await sql`
    SELECT id FROM daily_steps
    WHERE user_id = ${userId}
    AND title = ${instanceTitle}
    AND date = CAST(${dateStr}::text AS DATE)
  `
  
  if (existingInstance.length > 0) {
    return // Instance already exists
  }
  
  // Create instance
  const instanceId = crypto.randomUUID()
  const checklistJson = recurringStep.checklist ? JSON.stringify(recurringStep.checklist) : '[]'
  
  await sql`
    INSERT INTO daily_steps (
      id, user_id, goal_id, title, description, completed, date, 
      is_important, is_urgent, aspiration_id, area_id,
      estimated_time, xp_reward, deadline, checklist, require_checklist_complete,
      frequency, selected_days
    ) VALUES (
      ${instanceId}, ${userId}, ${recurringStep.goal_id || null}, ${instanceTitle}, 
      ${recurringStep.description || null}, false, 
      CAST(${dateStr}::text AS DATE), 
      ${recurringStep.is_important || false}, 
      ${recurringStep.is_urgent || false}, 
      ${recurringStep.aspiration_id || null}, 
      ${recurringStep.area_id || null}, 
      ${recurringStep.estimated_time || 30},
      ${recurringStep.xp_reward || 1}, 
      ${recurringStep.deadline || null},
      ${checklistJson}::jsonb, 
      ${recurringStep.require_checklist_complete || false},
      NULL, -- frequency = null (not recurring)
      '[]'::jsonb -- selected_days = empty (not recurring)
    )
  `
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    console.log(`Running recurring instances cron job at ${today.toISOString()}`)

    // Get all recurring steps
    const recurringSteps = await sql`
      SELECT 
        id, user_id, goal_id, title, description, completed, 
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        is_important, is_urgent, aspiration_id, area_id,
        estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
        COALESCE(checklist, '[]'::jsonb) as checklist,
        COALESCE(require_checklist_complete, false) as require_checklist_complete,
        frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days
      FROM daily_steps
      WHERE frequency IS NOT NULL
      AND completed = false
    `
    
    console.log(`Found ${recurringSteps.length} recurring steps`)

    let totalCreated = 0

    for (const step of recurringSteps) {
      try {
        // Check if step should have an instance for today or next 30 days
        let checkDate = new Date(today)
        let instanceCreated = false
        
        // Check up to 30 days ahead
        for (let i = 0; i < 31 && !instanceCreated; i++) {
          if (isStepScheduledForDay(step, checkDate)) {
            // Check if instance already exists
            const dateStr = checkDate.toISOString().split('T')[0]
            const dateFormatted = checkDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
            const instanceTitle = `${step.title} - ${dateFormatted}`
            
            const existingInstance = await sql`
              SELECT id FROM daily_steps
              WHERE user_id = ${step.user_id}
              AND title = ${instanceTitle}
              AND date = CAST(${dateStr}::text AS DATE)
            `
            
            if (existingInstance.length === 0) {
              // Check if there's a completed instance for this date
              const completedInstance = await sql`
                SELECT id FROM daily_steps
                WHERE user_id = ${step.user_id}
                AND title LIKE ${step.title + ' - %'}
                AND date = CAST(${dateStr}::text AS DATE)
                AND completed = true
              `
              
              if (completedInstance.length === 0) {
                await createRecurringStepInstance(step, checkDate, step.user_id)
                totalCreated++
                instanceCreated = true
                console.log(`Created instance for step ${step.title} on ${dateStr}`)
              }
            } else {
              instanceCreated = true // Instance already exists
            }
          }
          checkDate.setDate(checkDate.getDate() + 1)
        }
      } catch (error) {
        console.error(`Error processing recurring step ${step.id}:`, error)
      }
    }

    console.log(`Cron job completed: Created ${totalCreated} instances`)

    return NextResponse.json({
      success: true,
      message: `Created ${totalCreated} instances for ${recurringSteps.length} recurring steps`,
      createdCount: totalCreated,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      createdCount: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

