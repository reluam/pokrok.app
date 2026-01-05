import { NextRequest, NextResponse } from 'next/server'
import { createDailyStep, getDailyStepsByUserId, updateDailyStepFields, updateGoalProgressCombined, getGoalById } from '@/lib/cesta-db'
import { requireAuth, verifyEntityOwnership, verifyOwnership } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isStepScheduledForDay } from '@/app/[locale]/planner/components/utils/stepHelpers'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Helper function to create instance from recurring step
async function createRecurringStepInstance(recurringStep: any, targetDate: Date, userId: string): Promise<void> {
  // Use local date components (not UTC) to match client's timezone
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  
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
      frequency, selected_days, parent_recurring_step_id
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
      '[]'::jsonb, -- selected_days = empty (not recurring)
      ${recurringStep.id} -- parent_recurring_step_id = link to template
    )
  `
}

// Helper function to check if recurring step should be marked as completed
// This happens when:
// 1. The recurring step has an end_date
// 2. All instances are either completed or deleted (no incomplete instances remain)
// 3. At least one instance was completed
async function checkAndCompleteRecurringStepIfFinished(
  instanceTitle: string,
  userId: string,
  wasInstanceCompleted?: boolean // Optional: if we know the instance was completed before deletion
): Promise<void> {
  try {
    // Extract title prefix (everything before " - ")
    if (!instanceTitle || !instanceTitle.includes(' - ')) {
      return // Not an instance
    }
    
    const titlePrefix = instanceTitle.split(' - ')[0]
    
    // Find the original recurring step template
    const originalStepResult = await sql`
      SELECT 
        id, title, completed, 
        TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date
      FROM daily_steps
      WHERE user_id = ${userId}
      AND title = ${titlePrefix}
      AND frequency IS NOT NULL
      AND is_hidden = true
    `
    
    if (originalStepResult.length === 0) {
      return // Original step not found
    }
    
    const originalStep = originalStepResult[0]
    
    // Check if recurring step has an end_date
    if (!originalStep.recurring_end_date) {
      return // No end date, step continues indefinitely
    }
    
    // Check if original step is already completed
    if (originalStep.completed) {
      return // Already completed
    }
    
    // Find all remaining instances of this recurring step
    // Instances have title starting with "TitlePrefix - "
    const remainingInstances = await sql`
      SELECT id, completed
      FROM daily_steps
      WHERE user_id = ${userId}
      AND title LIKE ${titlePrefix + ' - %'}
      AND frequency IS NULL
    `
    
    // Check if all remaining instances are completed
    const allRemainingCompleted = remainingInstances.length === 0 || 
      remainingInstances.every((instance: any) => instance.completed === true)
    
    // Check if at least one instance is completed (either in remaining instances or the one we just processed)
    const atLeastOneCompleted = remainingInstances.some((instance: any) => instance.completed === true) ||
      wasInstanceCompleted === true
    
    // If all remaining instances are completed (or none exist) and at least one was completed, mark original as completed
    if (allRemainingCompleted && atLeastOneCompleted) {
      await sql`
        UPDATE daily_steps
        SET completed = true, completed_at = NOW()
        WHERE id = ${originalStep.id}
      `
      console.log(`Marked recurring step ${originalStep.title} as completed (all instances finished)`)
    }
  } catch (error) {
    console.error('Error checking if recurring step should be completed:', error)
    // Don't throw - this is a side effect, shouldn't fail the main operation
  }
}

// Helper function to create multiple instances in batch (much faster)
async function createRecurringStepInstancesBatch(
  recurringStep: any, 
  targetDates: Date[], 
  userId: string
): Promise<number> {
  if (targetDates.length === 0) return 0
  
  // Prepare all instance data
  const instances = targetDates.map(targetDate => {
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const day = String(targetDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const dateFormatted = targetDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
    const instanceTitle = `${recurringStep.title} - ${dateFormatted}`
    
    return {
      id: crypto.randomUUID(),
      dateStr,
      instanceTitle,
      targetDate
    }
  })
  
  // Check which instances already exist (batch check)
  const titles = instances.map(i => i.instanceTitle)
  const dateStrings = instances.map(i => i.dateStr)
  
  const existingInstances = await sql`
    SELECT title, date::text as date
    FROM daily_steps
    WHERE user_id = ${userId}
    AND title = ANY(${titles})
    AND date::text = ANY(${dateStrings})
  `
  
  // Create a set of existing (title, date) pairs for fast lookup
  const existingSet = new Set(
    existingInstances.map((e: any) => `${e.title}|${e.date}`)
  )
  
  // Filter out existing instances
  const newInstances = instances.filter(
    inst => !existingSet.has(`${inst.instanceTitle}|${inst.dateStr}`)
  )
  
  if (newInstances.length === 0) return 0
  
  // Prepare batch insert using UNNEST for better performance
  const checklistJson = recurringStep.checklist ? JSON.stringify(recurringStep.checklist) : '[]'
  const ids = newInstances.map(i => i.id)
  const instanceTitles = newInstances.map(i => i.instanceTitle)
  const instanceDates = newInstances.map(i => i.dateStr)
  
  // Execute batch insert using UNNEST
  await sql`
    INSERT INTO daily_steps (
      id, user_id, goal_id, title, description, completed, date, 
      is_important, is_urgent, aspiration_id, area_id,
      estimated_time, xp_reward, deadline, checklist, require_checklist_complete,
      frequency, selected_days, parent_recurring_step_id
    )
    SELECT 
      unnest(${ids}::text[]) as id,
      ${userId} as user_id,
      ${recurringStep.goal_id || null} as goal_id,
      unnest(${instanceTitles}::text[]) as title,
      ${recurringStep.description || null} as description,
      false as completed,
      unnest(${instanceDates}::text[])::date as date,
      ${recurringStep.is_important || false} as is_important,
      ${recurringStep.is_urgent || false} as is_urgent,
      ${recurringStep.aspiration_id || null} as aspiration_id,
      ${recurringStep.area_id || null} as area_id,
      ${recurringStep.estimated_time || 30} as estimated_time,
      ${recurringStep.xp_reward || 1} as xp_reward,
      ${recurringStep.deadline || null} as deadline,
      ${checklistJson}::jsonb as checklist,
      ${recurringStep.require_checklist_complete || false} as require_checklist_complete,
      NULL as frequency,
      '[]'::jsonb as selected_days,
      ${recurringStep.id} as parent_recurring_step_id
  `
  
  return newInstances.length
}

// Helper function to normalize date from database to YYYY-MM-DD string
// PostgreSQL DATE type is stored without time, so we need to preserve it exactly as stored
function normalizeDateFromDB(date: any): string | null {
  if (!date) return null
  
  // If it's already a YYYY-MM-DD string, return it directly
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date
  }
  
  // If it's an ISO string with time, extract just the date part (YYYY-MM-DD)
  if (typeof date === 'string' && date.includes('T')) {
    // Extract the date part before 'T' - this is the stored date
    const datePart = date.split('T')[0]
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return datePart
    }
  }
  
  // If it's a Date object (PostgreSQL DATE may be returned as Date object)
  // PostgreSQL DATE is stored without time, so when returned as Date object,
  // it's typically midnight UTC for that date
  // PostgreSQL DATE values are returned as Date objects with UTC midnight
  // Use UTC components to get the exact date stored in the database
  if (date instanceof Date || (typeof date === 'object' && 'getTime' in date)) {
    const d = new Date(date)
    
    // Always use UTC components for PostgreSQL DATE values
    // This ensures we get the exact date stored, regardless of server timezone
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return null
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const goalId = searchParams.get('goalId')
    const filterImportantOnly = searchParams.get('filterImportantOnly') === 'true'
    
    // Support both userId and goalId queries
    if (goalId) {
      try {
        // ✅ SECURITY: Ověření vlastnictví goalu
        const goalOwned = await verifyEntityOwnership(goalId, 'goals', dbUser)
        if (!goalOwned) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        
        // Query steps for a specific goal
        // Note: goal_id is VARCHAR(255) in the database
        const steps = await sql`
          SELECT 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
            COALESCE(checklist, '[]'::jsonb) as checklist,
            COALESCE(require_checklist_complete, false) as require_checklist_complete,
            frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
            TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
            TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date,
            TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
            TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
            recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
            parent_recurring_step_id
          FROM daily_steps
          WHERE goal_id = ${goalId} AND user_id = ${dbUser.id}
          ORDER BY created_at DESC
        `
        
        const normalizedSteps = steps.map((step: any) => ({
          ...step,
          date: normalizeDateFromDB(step.date)
        }))
        
        return NextResponse.json(normalizedSteps)
      } catch (error: any) {
        console.error('Error fetching steps for goal:', goalId, error)
        console.error('Error stack:', error?.stack)
        return NextResponse.json({ 
          error: 'Internal server error', 
          details: error?.message || 'Unknown error',
          goalId 
        }, { status: 500 })
      }
    }
    
    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get daily steps for user with optional date filtering
    let steps
    if (startDate && endDate) {
      // Date range query (optimized)
      steps = await getDailyStepsByUserId(targetUserId, undefined, startDate, endDate)
    } else if (date) {
      // Single date query
      steps = await getDailyStepsByUserId(targetUserId, new Date(date))
    } else {
      // All steps (fallback - should be avoided for performance)
      steps = await getDailyStepsByUserId(targetUserId)
    }
    
    // Check if we need to create more instances for recurring steps
    // Find all recurring step templates (is_hidden = true, frequency != null)
    const recurringStepTemplates = await sql`
      SELECT 
        id, user_id, goal_id, title, description, 
        frequency, selected_days,
        is_important, is_urgent, aspiration_id, area_id,
        estimated_time, xp_reward, deadline,
        checklist, require_checklist_complete,
        TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
        TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
        TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date
      FROM daily_steps
      WHERE user_id = ${targetUserId}
      AND is_hidden = true
      AND frequency IS NOT NULL
    `
    
    // For each recurring step template, check if we need to create more instances
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    for (const template of recurringStepTemplates) {
      try {
        const lastInstanceDate = template.last_instance_date 
          ? new Date(template.last_instance_date) 
          : (template.recurring_start_date ? new Date(template.recurring_start_date) : today)
        lastInstanceDate.setHours(0, 0, 0, 0)
        
        // If last instance is within 30 days, create more instances
        if (lastInstanceDate <= thirtyDaysFromNow) {
          const startDate = lastInstanceDate > today ? lastInstanceDate : new Date(today)
          startDate.setDate(startDate.getDate() + 1) // Start from day after last instance
          
          const endDate = template.recurring_end_date ? new Date(template.recurring_end_date) : null
          if (endDate) {
            endDate.setHours(23, 59, 59, 999)
          }
          
          // Calculate max date (2 months from start or end date, whichever is earlier)
          const maxDate = new Date(startDate)
          maxDate.setMonth(maxDate.getMonth() + 2)
          const finalEndDate = endDate && endDate < maxDate ? endDate : maxDate
          
          // Collect all dates that should have instances
          const targetDates: Date[] = []
          let checkDate = new Date(startDate)
          const maxInstances = 60 // Safety limit (2 months)
          
          while (checkDate <= finalEndDate && targetDates.length < maxInstances) {
            if (isStepScheduledForDay(template, checkDate)) {
              targetDates.push(new Date(checkDate))
            }
            checkDate.setDate(checkDate.getDate() + 1)
          }
          
          // Create all instances in batch (much faster)
          const createdCount = await createRecurringStepInstancesBatch(template, targetDates, targetUserId)
          
          // Update last_instance_date on the recurring step
          if (targetDates.length > 0) {
            const lastCreatedDate = targetDates[targetDates.length - 1]
            const year = lastCreatedDate.getFullYear()
            const month = String(lastCreatedDate.getMonth() + 1).padStart(2, '0')
            const day = String(lastCreatedDate.getDate()).padStart(2, '0')
            const lastInstanceDateStr = `${year}-${month}-${day}`
            
            await sql`
              UPDATE daily_steps
              SET last_instance_date = CAST(${lastInstanceDateStr}::text AS DATE)
              WHERE id = ${template.id}
            `
          }
        }
      } catch (error) {
        console.error(`Error creating instances for recurring step ${template.id}:`, error)
        // Continue with other templates
      }
    }
    
    // Reload steps after creating new instances (if any were created)
    if (recurringStepTemplates.length > 0) {
      if (startDate && endDate) {
        steps = await getDailyStepsByUserId(targetUserId, undefined, startDate, endDate)
      } else if (date) {
        steps = await getDailyStepsByUserId(targetUserId, new Date(date))
      } else {
        steps = await getDailyStepsByUserId(targetUserId)
      }
    }
    
    // Normalize all date fields to YYYY-MM-DD strings to avoid timezone issues
    let normalizedSteps = steps.map((step) => ({
      ...step,
      date: normalizeDateFromDB(step.date)
    }))
    
    // If filterImportantOnly is requested, filter to only important steps for today
    if (filterImportantOnly && date) {
      // Check if workflow is enabled
      const workflow = await sql`
        SELECT * FROM workflows 
        WHERE user_id = ${dbUser.id} AND type = 'only_the_important' AND enabled = true
        LIMIT 1
      `
      
      if (workflow.length > 0) {
        // Get today's date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString().split('T')[0]
        const requestedDate = date.split('T')[0]
        
        // If requesting today's steps, filter to only important ones
        if (requestedDate === todayStr) {
          const importantPlanning = await sql`
            SELECT step_id FROM important_steps_planning 
            WHERE user_id = ${dbUser.id} AND date = ${todayStr} AND category = 'important'
          `
          
          const importantStepIds = new Set(importantPlanning.map((p: any) => p.step_id))
          
          normalizedSteps = normalizedSteps.filter((step) => 
            importantStepIds.has(step.id)
          )
        }
      }
    }
    
    return NextResponse.json(normalizedSteps)
  } catch (error) {
    console.error('Error fetching daily steps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { 
      userId, 
      goalId, 
      areaId,
      title, 
      description, 
      date, 
      isImportant, 
      isUrgent, 
      aspirationId,
      estimatedTime,
      xpReward,
      checklist,
      requireChecklistComplete,
      frequency,
      selectedDays,
      recurringStartDate,
      recurringEndDate,
      recurringDisplayMode
    } = body
    
    // Debug logging
    console.log('Creating step with:', { userId, goalId, areaId, title })
    
    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ✅ SECURITY: Ověření vlastnictví goalId, pokud je poskytnut
    if (goalId) {
      const goalOwned = await verifyEntityOwnership(goalId, 'goals', dbUser)
      if (!goalOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    // ✅ SECURITY: Ověření vlastnictví areaId, pokud je poskytnut
    if (areaId) {
      const areaOwned = await verifyEntityOwnership(areaId, 'areas', dbUser)
      if (!areaOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    // If goal is selected, area should come from goal (allow both to be set)
    // Only validate if area is set but goal is not (which is fine)
    // If both are set, verify that area matches goal's area
    if (areaId && goalId) {
      // Get goal to verify area matches
      const goalResult = await sql`
        SELECT area_id FROM goals WHERE id = ${goalId} AND user_id = ${dbUser.id}
      `
      if (goalResult.length > 0) {
        const goalAreaId = goalResult[0].area_id
        // If goal has an area, it should match the provided areaId
        if (goalAreaId && goalAreaId !== areaId) {
      return NextResponse.json({ 
            error: 'Area does not match goal\'s area',
            details: 'The provided area does not match the area assigned to the selected goal'
      }, { status: 400 })
        }
        // If goal has no area but areaId is provided, use the provided areaId
        // This allows setting area on step even if goal doesn't have one
        // (The area will be automatically set from goal if goal has one, but if not, user can set it manually)
      } else {
        // Goal not found - this should not happen if ownership check passed, but handle gracefully
        console.error(`Goal ${goalId} not found for user ${dbUser.id}`)
      }
    }
    
    // Normalize areaId - empty string should be treated as null
    const normalizedAreaId = areaId && areaId.trim() !== '' ? areaId : null
    const normalizedGoalId = goalId && goalId.trim() !== '' ? goalId : null
    
    if (!title) {
      return NextResponse.json({ 
        error: 'Title is required',
        details: { hasTitle: !!title }
      }, { status: 400 })
    }
    
    // Použít dbUser.id místo userId z body
    const targetUserId = userId || dbUser.id

    // Handle date - always work with YYYY-MM-DD strings to avoid timezone issues
    // For repeating steps (frequency is set), date should be null
    // If date is provided as YYYY-MM-DD string, use it directly
    // If it's a Date object or ISO string, extract YYYY-MM-DD from it using local date components
    // If no date is provided and not repeating, use today's date in client's timezone (but we're on server, so use UTC midnight converted)
    let dateValue: string | Date | null = null
    if (frequency) {
      // Repeating step - date should be null
      dateValue = null
    } else if (date) {
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already YYYY-MM-DD format - use directly as string
        // This preserves the client's intended date regardless of server timezone
        dateValue = date
      } else if (typeof date === 'string' && date.includes('T')) {
        // ISO string - extract date part (YYYY-MM-DD) from the ISO string
        // This assumes the ISO string represents the client's local date
        dateValue = date.split('T')[0]
      } else {
        // Date object or other format - convert to YYYY-MM-DD string
        if (date instanceof Date) {
          // Date object - extract date components
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          dateValue = `${year}-${month}-${day}`
        } else if (typeof date === 'object' && date !== null) {
          // Object (not Date) - try to convert to string first
          const dateStr = String(date)
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateValue = dateStr
          } else {
            // Fallback: use today's date
            const now = new Date()
            const year = now.getUTCFullYear()
            const month = String(now.getUTCMonth() + 1).padStart(2, '0')
            const day = String(now.getUTCDate()).padStart(2, '0')
            dateValue = `${year}-${month}-${day}`
          }
        } else {
          // String or other - try to parse
          const dateObj = typeof date === 'string' ? new Date(date) : new Date()
        // Use UTC components to preserve the date as intended
        if (typeof date === 'string' && date.includes('Z')) {
          // UTC ISO string - extract date part directly
          dateValue = date.split('T')[0]
        } else {
          // Local date - extract date components
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          dateValue = `${year}-${month}-${day}`
          }
        }
      }
    } else {
      // No date provided - use today's date
      // Since we're on the server, we should ideally get client's timezone, but as fallback use UTC date
      // In practice, client should always send date, so this is rare
      const now = new Date()
      // Use UTC date to ensure consistency (client should send date anyway)
      const year = now.getUTCFullYear()
      const month = String(now.getUTCMonth() + 1).padStart(2, '0')
      const day = String(now.getUTCDate()).padStart(2, '0')
      dateValue = `${year}-${month}-${day}`
    }

    // Handle recurring dates
    let recurringStartDateValue: string | null = null
    if (recurringStartDate) {
      if (typeof recurringStartDate === 'string' && recurringStartDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        recurringStartDateValue = recurringStartDate
      } else {
        // Default to today if invalid
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        recurringStartDateValue = `${year}-${month}-${day}`
      }
    } else if (frequency) {
      // Default to today if not provided
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      recurringStartDateValue = `${year}-${month}-${day}`
    }
    
    let recurringEndDateValue: string | null = null
    if (recurringEndDate && typeof recurringEndDate === 'string' && recurringEndDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      recurringEndDateValue = recurringEndDate
    }

    const stepData = {
      user_id: targetUserId,
      goal_id: normalizedGoalId,
      area_id: normalizedAreaId,
      title,
      description: description || undefined,
      completed: false,
      date: dateValue || undefined, // Pass as string (YYYY-MM-DD) or Date, or undefined for repeating steps
      is_important: isImportant || false,
      is_urgent: isUrgent || false,
      aspiration_id: aspirationId || undefined,
      estimated_time: estimatedTime || 30,
      xp_reward: xpReward || 1,
      checklist: checklist || [],
      require_checklist_complete: requireChecklistComplete || false,
      frequency: frequency || null,
      selected_days: selectedDays || [],
      recurring_start_date: recurringStartDateValue,
      recurring_end_date: recurringEndDateValue,
      recurring_display_mode: 'next_only', // Always show only nearest instance
      is_hidden: frequency ? true : false // Hide recurring step template, show instances
    }

    let step
    try {
      step = await createDailyStep(stepData)
    } catch (createError: any) {
      console.error('Error in createDailyStep:', createError)
      // Check if it's a constraint violation
      if (createError?.code === '23514' || createError?.message?.includes('check constraint') || createError?.message?.includes('CHECK')) {
        return NextResponse.json({ 
          error: 'Database constraint violation',
          details: 'The step cannot be created because of a database constraint. Please run the migration to update the database schema.',
          hint: 'Visit /api/migrate to run database migrations',
          errorCode: createError.code,
          errorMessage: createError.message
        }, { status: 500 })
      }
      throw createError // Re-throw if it's not a constraint error
    }
    
    // If this is a recurring step, create ALL instances (up to 2 months or end date)
    if (step.frequency && step.frequency !== null) {
      try {
        const startDate = recurringStartDateValue ? new Date(recurringStartDateValue) : new Date()
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = recurringEndDateValue ? new Date(recurringEndDateValue) : null
        if (endDate) {
          endDate.setHours(23, 59, 59, 999)
        }
        
        // Calculate max date (2 months from start or end date, whichever is earlier)
        const maxDate = new Date(startDate)
        maxDate.setMonth(maxDate.getMonth() + 2)
        const finalEndDate = endDate && endDate < maxDate ? endDate : maxDate
        
        // Collect all dates that should have instances
        const targetDates: Date[] = []
        let checkDate = new Date(startDate)
        const maxInstances = 60 // Safety limit (2 months)
        
        while (checkDate <= finalEndDate && targetDates.length < maxInstances) {
          if (isStepScheduledForDay(step, checkDate)) {
            targetDates.push(new Date(checkDate))
          }
          checkDate.setDate(checkDate.getDate() + 1)
        }
        
        // Create all instances in batch (much faster)
        const createdCount = await createRecurringStepInstancesBatch(step, targetDates, targetUserId)
        
        // Update last_instance_date on the recurring step
        if (targetDates.length > 0) {
          const lastInstanceDate = targetDates[targetDates.length - 1]
          const year = lastInstanceDate.getFullYear()
          const month = String(lastInstanceDate.getMonth() + 1).padStart(2, '0')
          const day = String(lastInstanceDate.getDate()).padStart(2, '0')
          const lastInstanceDateStr = `${year}-${month}-${day}`
          
          await sql`
            UPDATE daily_steps
            SET last_instance_date = CAST(${lastInstanceDateStr}::text AS DATE)
            WHERE id = ${step.id}
          `
        }
        
        console.log(`Created ${createdCount} instances for recurring step ${step.title}`)
      } catch (instanceError) {
        console.error('Error creating recurring step instances:', instanceError)
        // Don't fail the request - step was created successfully, instances can be created later
      }
    }
    
    // Normalize date before returning
    const normalizedDate = normalizeDateFromDB(step.date)
    
    const normalizedStep = {
      ...step,
      date: normalizedDate
    }
    
    return NextResponse.json(normalizedStep)
  } catch (error) {
    console.error('Error creating daily step:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      stack: errorStack 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { stepId, completed, completedAt, completionDate, title, description, goalId, goal_id, areaId, aspirationId, aspiration_id, isImportant, isUrgent, estimatedTime, xpReward, date, checklist, requireChecklistComplete, frequency, selectedDays, lastInstanceDate } = body
    
    // Debug logging
    console.log('Updating step:', { stepId, goalId, goal_id, areaId, hasGoalId: goalId !== undefined, hasGoal_id: goal_id !== undefined, hasAreaId: areaId !== undefined })
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví stepu
    const stepOwned = await verifyEntityOwnership(stepId, 'daily_steps', dbUser)
    if (!stepOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ✅ SECURITY: Ověření vlastnictví goalId, pokud je poskytnut
    if (goalId || goal_id) {
      const targetGoalId = goalId || goal_id
      const goalOwned = await verifyEntityOwnership(targetGoalId, 'goals', dbUser)
      if (!goalOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    // ✅ SECURITY: Ověření vlastnictví areaId, pokud je poskytnut
    if (areaId) {
      const areaOwned = await verifyEntityOwnership(areaId, 'areas', dbUser)
      if (!areaOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    // If goal is selected, area should come from goal (allow both to be set)
    // Only validate if area is set but goal is not (which is fine)
    // If both are set, verify that area matches goal's area
    const finalGoalId = goalId || goal_id
    if (areaId && finalGoalId) {
      // Get goal to verify area matches
      const goalResult = await sql`
        SELECT area_id FROM goals WHERE id = ${finalGoalId} AND user_id = ${dbUser.id}
      `
      if (goalResult.length > 0) {
        const goalAreaId = goalResult[0].area_id
        // If goal has an area, it should match the provided areaId
        if (goalAreaId && goalAreaId !== areaId) {
      return NextResponse.json({ 
            error: 'Area does not match goal\'s area',
            details: 'The provided area does not match the area assigned to the selected goal'
      }, { status: 400 })
        }
        // If goal has no area but areaId is provided, that's also invalid
        if (!goalAreaId && areaId) {
          return NextResponse.json({ 
            error: 'Goal has no area assigned',
            details: 'The selected goal does not have an area, so area cannot be set'
          }, { status: 400 })
        }
      }
    }
    
    // Check what type of update this is
    const isCompletionOnly = completed !== undefined && title === undefined && date === undefined
    const isDateOnly = date !== undefined && title === undefined && completed === undefined
    
    if (isCompletionOnly) {
      // First, get the current step to check if it's recurring
      const currentStepResult = await sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
          COALESCE(checklist, '[]'::jsonb) as checklist,
          COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
          TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
          TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date,
          TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
          TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
          recurring_display_mode, COALESCE(is_hidden, false) as is_hidden
        FROM daily_steps
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
      `
      
      if (currentStepResult.length === 0) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }
      
      const currentStep = currentStepResult[0]
      
      // If this is a recurring step being completed, create a new instance instead
      if (completed && currentStep.frequency && currentStep.frequency !== null) {
        // Determine completion date
        let completionDateValue: string
        if (completionDate) {
          // Use provided completion date
          if (completionDate instanceof Date) {
            const year = completionDate.getFullYear()
            const month = String(completionDate.getMonth() + 1).padStart(2, '0')
            const day = String(completionDate.getDate()).padStart(2, '0')
            completionDateValue = `${year}-${month}-${day}`
          } else if (typeof completionDate === 'string') {
            if (completionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              completionDateValue = completionDate
            } else if (completionDate.includes('T')) {
              completionDateValue = completionDate.split('T')[0]
            } else {
              completionDateValue = new Date().toISOString().split('T')[0]
            }
          } else {
            completionDateValue = new Date().toISOString().split('T')[0]
          }
        } else if (completedAt) {
          // Use completedAt if provided (extract date part)
          if (typeof completedAt === 'string' && completedAt.includes('T')) {
            completionDateValue = completedAt.split('T')[0]
          } else {
            completionDateValue = new Date().toISOString().split('T')[0]
          }
        } else {
          // Use current date if not provided
          completionDateValue = new Date().toISOString().split('T')[0]
        }
        
        // Format completion date for display in title
        const completionDateObj = new Date(completionDateValue)
        const formattedDate = completionDateObj.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
        
        // Create new step instance with title "Original Title - Date"
        const newStepTitle = `${currentStep.title} - ${formattedDate}`
        const newStepId = crypto.randomUUID()
        const checklistJson = currentStep.checklist ? JSON.stringify(currentStep.checklist) : '[]'
        
        // Create the completed instance
        const newStepResult = await sql`
          INSERT INTO daily_steps (
            id, user_id, goal_id, title, description, completed, date, 
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, checklist, require_checklist_complete,
            frequency, selected_days, parent_recurring_step_id
          ) VALUES (
            ${newStepId}, ${dbUser.id}, ${currentStep.goal_id || null}, ${newStepTitle}, 
            ${currentStep.description || null}, true, 
            CAST(${completionDateValue}::text AS DATE), 
            ${currentStep.is_important || false}, 
            ${currentStep.is_urgent || false}, 
            ${currentStep.aspiration_id || null}, 
            ${currentStep.area_id || null}, 
            ${currentStep.estimated_time || 30},
            ${currentStep.xp_reward || 1}, 
            ${currentStep.deadline || null},
            ${completedAt ? new Date(completedAt) : new Date()},
            ${checklistJson}::jsonb, 
            ${currentStep.require_checklist_complete || false},
            NULL, -- frequency = null (not recurring)
            '[]'::jsonb, -- selected_days = empty (not recurring)
            ${currentStep.id} -- parent_recurring_step_id = link to template
          ) RETURNING 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
            COALESCE(checklist, '[]'::jsonb) as checklist,
            COALESCE(require_checklist_complete, false) as require_checklist_complete,
            frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
            parent_recurring_step_id
        `
        
        const newStep = newStepResult[0]
        
        // Update goal progress if step has a goal_id
        let updatedGoal = null
        if (newStep.goal_id) {
          try {
            const goal = await getGoalById(newStep.goal_id)
            if (goal) {
              if (goal.progress_calculation_type === 'metrics') {
                // Only update from metrics, not steps
              } else {
                await updateGoalProgressCombined(newStep.goal_id)
                updatedGoal = await getGoalById(newStep.goal_id)
              }
            }
          } catch (progressError: any) {
            console.error('Error updating goal progress after step completion:', progressError)
            // Don't fail the request if progress update fails
          }
        }
        
        const normalizedResult = {
          ...newStep,
          date: normalizeDateFromDB(newStep.date)
        }
        
        // Update last_completed_instance_date
        await sql`
          UPDATE daily_steps
          SET last_completed_instance_date = CAST(${completionDateValue}::text AS DATE)
          WHERE id = ${currentStep.id}
        `
        
        // If completion date is today or in the future, create next occurrence
        const completionDateForNext = new Date(completionDateValue)
        completionDateForNext.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (completionDateForNext >= today) {
          // Find next occurrence starting from completion date + 1 day
          let nextDate = new Date(completionDateForNext)
          nextDate.setDate(nextDate.getDate() + 1)
          
          // Check up to 60 days ahead to find next occurrence
          for (let i = 0; i < 60; i++) {
            if (isStepScheduledForDay(currentStep, nextDate)) {
              // Check if instance already exists
              const dateStr = nextDate.toISOString().split('T')[0]
              const dateFormatted = nextDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
              const instanceTitle = `${currentStep.title} - ${dateFormatted}`
              
              const existingInstance = await sql`
                SELECT id FROM daily_steps
                WHERE user_id = ${dbUser.id}
                AND title = ${instanceTitle}
                AND date = CAST(${dateStr}::text AS DATE)
              `
              
              if (existingInstance.length === 0) {
                await createRecurringStepInstance(currentStep, nextDate, dbUser.id)
                // Update last_instance_date
                await sql`
                  UPDATE daily_steps
                  SET last_instance_date = CAST(${dateStr}::text AS DATE)
                  WHERE id = ${currentStep.id}
                `
                console.log(`Created next instance for recurring step ${currentStep.title} on ${dateStr}`)
              }
              break // Only create next occurrence
            }
            nextDate.setDate(nextDate.getDate() + 1)
          }
        }
        
        return NextResponse.json({
          ...normalizedResult,
          goal: updatedGoal
        })
      }
      
      // Check if this is an instance of a recurring step being completed
      // If so, create next occurrence after completion
      // Note: This handles instances, but we still need to update the instance itself below
      const isInstanceOfRecurring = completed && currentStep.title && currentStep.title.includes(' - ')
      if (isInstanceOfRecurring) {
        // This is an instance - find the original recurring step
        const titlePrefix = currentStep.title.split(' - ')[0]
        const originalStepResult = await sql`
          SELECT 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
            COALESCE(checklist, '[]'::jsonb) as checklist,
            COALESCE(require_checklist_complete, false) as require_checklist_complete,
            frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
            TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
            TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date,
            TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
            TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
            recurring_display_mode, is_hidden
          FROM daily_steps
          WHERE user_id = ${dbUser.id}
          AND title = ${titlePrefix}
          AND frequency IS NOT NULL
        `
        
        if (originalStepResult.length > 0) {
          const originalStep = originalStepResult[0]
          
          // Determine completion date
          // For instances, use the instance's date as completion date if no explicit completionDate is provided
          let completionDateValue: string
          if (completionDate) {
            if (completionDate instanceof Date) {
              const year = completionDate.getFullYear()
              const month = String(completionDate.getMonth() + 1).padStart(2, '0')
              const day = String(completionDate.getDate()).padStart(2, '0')
              completionDateValue = `${year}-${month}-${day}`
            } else if (typeof completionDate === 'string') {
              if (completionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                completionDateValue = completionDate
              } else if (completionDate.includes('T')) {
                completionDateValue = completionDate.split('T')[0]
              } else {
                completionDateValue = new Date().toISOString().split('T')[0]
              }
            } else {
              completionDateValue = new Date().toISOString().split('T')[0]
            }
          } else if (completedAt) {
            // Use completedAt if provided (extract date part)
            if (typeof completedAt === 'string' && completedAt.includes('T')) {
              completionDateValue = completedAt.split('T')[0]
            } else {
              completionDateValue = new Date().toISOString().split('T')[0]
            }
          } else if (currentStep.date) {
            // For instances, use the instance's date as completion date
            completionDateValue = currentStep.date
          } else {
            completionDateValue = new Date().toISOString().split('T')[0]
          }
          
          console.log(`[Instance completion] Step: ${currentStep.title}, completionDateValue: ${completionDateValue}, provided completionDate: ${completionDate}, currentStep.date: ${currentStep.date}`)
          
          // Update last_completed_instance_date on the original recurring step
          await sql`
            UPDATE daily_steps
            SET last_completed_instance_date = CAST(${completionDateValue}::text AS DATE)
            WHERE id = ${originalStep.id}
          `
          
          // If completion date is today or in the future, create next occurrence
          const completionDateForInstance = new Date(completionDateValue)
          completionDateForInstance.setHours(0, 0, 0, 0)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (completionDateForInstance >= today) {
            // Find next occurrence starting from completion date + 1 day
            let nextDateForInstance = new Date(completionDateForInstance)
            nextDateForInstance.setDate(nextDateForInstance.getDate() + 1)
            
            // Check up to 60 days ahead to find next occurrence
            for (let i = 0; i < 60; i++) {
              if (isStepScheduledForDay(originalStep, nextDateForInstance)) {
                // Check if instance already exists
                const dateStr = nextDateForInstance.toISOString().split('T')[0]
                const dateFormatted = nextDateForInstance.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
                const instanceTitle = `${originalStep.title} - ${dateFormatted}`
                
                const existingInstance = await sql`
                  SELECT id FROM daily_steps
                  WHERE user_id = ${dbUser.id}
                  AND title = ${instanceTitle}
                  AND date = CAST(${dateStr}::text AS DATE)
                `
                
                if (existingInstance.length === 0) {
                  await createRecurringStepInstance(originalStep, nextDateForInstance, dbUser.id)
                  // Update last_instance_date
                  await sql`
                    UPDATE daily_steps
                    SET last_instance_date = CAST(${dateStr}::text AS DATE)
                    WHERE id = ${originalStep.id}
                  `
                  console.log(`Created next instance for recurring step ${originalStep.title} on ${dateStr}`)
                }
                break // Only create next occurrence
              }
              nextDateForInstance.setDate(nextDateForInstance.getDate() + 1)
            }
          }
          
          // Check if recurring step should be marked as completed
          // (if it has end_date and all instances are completed)
          // We know the instance is being completed, so pass wasInstanceCompleted = true
          await checkAndCompleteRecurringStepIfFinished(currentStep.title, dbUser.id, true)
        }
        // Continue to update the instance itself below
      }
      
      // Handle lastInstanceDate update if provided (for recurring steps)
      if (lastInstanceDate !== undefined) {
        await sql`
          UPDATE daily_steps
          SET last_instance_date = CAST(${lastInstanceDate}::text AS DATE)
          WHERE id = ${stepId} AND user_id = ${dbUser.id}
        `
      }
      
      // For non-recurring steps or uncompleting, update normally
      // Return date as YYYY-MM-DD string using TO_CHAR
      // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
      const result = await sql`
        UPDATE daily_steps 
        SET 
          completed = ${completed},
          completed_at = ${completedAt ? new Date(completedAt) : null},
          updated_at = NOW()
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
        RETURNING 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
          COALESCE(checklist, '[]'::jsonb) as checklist,
          COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
          TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
          TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date
      `
      
      if (result.length === 0) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }
      
      const updatedStep = result[0]
      
      // Update goal progress if step has a goal_id
      let updatedGoal = null
      if (updatedStep.goal_id) {
        try {
          const goal = await getGoalById(updatedStep.goal_id)
          if (goal) {
            if (goal.progress_calculation_type === 'metrics') {
              // Only update from metrics, not steps
            } else {
              await updateGoalProgressCombined(updatedStep.goal_id)
              updatedGoal = await getGoalById(updatedStep.goal_id)
            }
          }
        } catch (progressError: any) {
          console.error('Error updating goal progress after step completion:', progressError)
          // Don't fail the request if progress update fails
        }
      }
      
      const normalizedResult = {
        ...updatedStep,
        date: normalizeDateFromDB(updatedStep.date)
      }
      
      return NextResponse.json({
        ...normalizedResult,
        goal: updatedGoal
      })
    } else if (isDateOnly) {
      // This is a date-only update (from drag & drop)
      // Use SQL DATE() function to ensure date-only storage
      if (date) {
        // Use CAST to ensure date-only storage without time component
        // Return date as YYYY-MM-DD string using TO_CHAR
        // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
        const result = await sql`
          UPDATE daily_steps 
          SET 
            date = CAST(${date}::text AS DATE),
            updated_at = NOW()
          WHERE id = ${stepId} AND user_id = ${dbUser.id}
          RETURNING 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
        `
        
        if (result.length === 0) {
          return NextResponse.json({ error: 'Step not found' }, { status: 404 })
        }
        
        const normalizedResult = {
          ...result[0],
          date: normalizeDateFromDB(result[0].date)
        }
        return NextResponse.json(normalizedResult)
      } else {
        // Setting date to null
        // Return date as YYYY-MM-DD string using TO_CHAR (will be null)
        // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
        const result = await sql`
          UPDATE daily_steps 
          SET 
            date = NULL,
            updated_at = NOW()
          WHERE id = ${stepId} AND user_id = ${dbUser.id}
          RETURNING 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
        `
        
        if (result.length === 0) {
          return NextResponse.json({ error: 'Step not found' }, { status: 404 })
        }
        
        const normalizedResult = {
          ...result[0],
          date: normalizeDateFromDB(result[0].date)
        }
        return NextResponse.json(normalizedResult)
      }
    } else {
      // This is a full update (edit form)
      // Format date if provided
      let dateValue: string | null = null
      if (date !== undefined) {
        if (date) {
          if (date instanceof Date) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            dateValue = `${year}-${month}-${day}`
          } else if (typeof date === 'string') {
            if (date.includes('T')) {
              dateValue = date.split('T')[0]
            } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateValue = date
            }
          }
        } else {
          dateValue = null
        }
      }

      // Use safe update function
      const updates: any = {}
      if (title !== undefined) updates.title = title
      if (description !== undefined) updates.description = description
      
      // Handle goal_id and area_id with proper mutual exclusivity
      // Normalize empty strings to null
      const normalizedGoalId = (goalId !== undefined && goalId !== null && String(goalId).trim() !== '') 
        ? (goalId || goal_id) 
        : ((goal_id !== undefined && goal_id !== null && String(goal_id).trim() !== '') ? goal_id : null)
      const normalizedAreaId = (areaId !== undefined && areaId !== null && String(areaId).trim() !== '') 
        ? areaId 
        : null
      
      // Only update if explicitly provided in the request
      // Check if values are actually provided (not just undefined or empty)
      const hasGoalIdValue = (goalId !== undefined && goalId !== null && String(goalId).trim() !== '') || 
                            (goal_id !== undefined && goal_id !== null && String(goal_id).trim() !== '')
      const hasAreaIdValue = areaId !== undefined && areaId !== null && String(areaId).trim() !== ''
      
      // Determine which one to use - prioritize non-null values
      // If both are provided, check which one has a value
      const bothProvided = (goalId !== undefined || goal_id !== undefined) && areaId !== undefined
      
      console.log('🔍 PUT request logic:', {
        goalId,
        goal_id,
        areaId,
        hasGoalIdValue,
        hasAreaIdValue,
        bothProvided,
        normalizedGoalId,
        normalizedAreaId
      })
      
      if (bothProvided) {
        // Both were provided - use the one with a value
        if (hasGoalIdValue) {
          // goalId has a value - use it and clear area_id
          console.log('✅ Using goalId, clearing area_id')
          updates.goal_id = normalizedGoalId
          updates.area_id = null
        } else if (hasAreaIdValue) {
          // areaId has a value - use it and clear goal_id
          console.log('✅ Using areaId, clearing goal_id')
          updates.area_id = normalizedAreaId
          updates.goal_id = null
        } else {
          // Both are null/empty - clear both
          console.log('⚠️ Both are null/empty, clearing both')
          updates.goal_id = null
          updates.area_id = null
        }
      } else if (goalId !== undefined || goal_id !== undefined) {
        // Only goalId was provided
        if (hasGoalIdValue) {
          console.log('✅ Only goalId provided with value, clearing area_id')
          updates.goal_id = normalizedGoalId
          updates.area_id = null // Clear area_id if goalId has a value
        } else {
          // goalId is null/empty - clear it, but don't touch area_id
          console.log('⚠️ Only goalId provided but null/empty, clearing goal_id only')
          updates.goal_id = null
        }
      } else if (areaId !== undefined) {
        // Only areaId was provided
        if (hasAreaIdValue) {
          console.log('✅ Only areaId provided with value, clearing goal_id')
          updates.area_id = normalizedAreaId
          updates.goal_id = null // Clear goal_id if areaId has a value
        } else {
          // areaId is null/empty - clear it
          console.log('⚠️ Only areaId provided but null/empty, clearing area_id only')
          updates.area_id = null
        }
      } else {
        console.log('⚠️ Neither goalId nor areaId provided in request')
      }
      
      console.log('📝 Final updates object:', updates)
      if (aspirationId !== undefined || aspiration_id !== undefined) {
        updates.aspiration_id = aspirationId || aspiration_id || null
      }
      if (isImportant !== undefined) updates.is_important = isImportant
      if (isUrgent !== undefined) updates.is_urgent = isUrgent
      if (estimatedTime !== undefined) updates.estimated_time = estimatedTime
      if (xpReward !== undefined) updates.xp_reward = xpReward
      if (date !== undefined) updates.date = dateValue
      if (checklist !== undefined) updates.checklist = checklist
      if (requireChecklistComplete !== undefined) updates.require_checklist_complete = requireChecklistComplete
      if (frequency !== undefined) updates.frequency = frequency || null
      if (selectedDays !== undefined) updates.selected_days = selectedDays || []

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
      }

      console.log('💾 Calling updateDailyStepFields with:', { stepId, updates })
      const updatedStep = await updateDailyStepFields(stepId, updates)
      console.log('📦 Updated step returned:', updatedStep ? {
        id: updatedStep.id,
        goal_id: updatedStep.goal_id,
        area_id: updatedStep.area_id,
        title: updatedStep.title
      } : null)

      if (!updatedStep) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }

      const normalizedResult = {
        ...updatedStep,
        date: normalizeDateFromDB(updatedStep.date)
      }
      return NextResponse.json(normalizedResult)
    }
  } catch (error: any) {
    console.error('Error updating daily step:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    console.error('Error name:', error?.name)
    if (error?.code) {
      console.error('Error code:', error.code)
    }
    if (error?.detail) {
      console.error('Error detail:', error.detail)
    }
    if (error?.hint) {
      console.error('Error hint:', error.hint)
    }
    if (error?.position) {
      console.error('Error position:', error.position)
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const stepId = searchParams.get('stepId')
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví stepu
    const stepOwned = await verifyEntityOwnership(stepId, 'daily_steps', dbUser)
    if (!stepOwned) {
      // Check if step exists at all for better error message
      const stepCheck = await sql`
        SELECT id, user_id FROM daily_steps WHERE id = ${stepId} LIMIT 1
      `
      if (stepCheck.length === 0) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get the step to check if it's a recurring step template or an instance
    const stepToDelete = await sql`
      SELECT id, title, is_hidden, frequency, completed
      FROM daily_steps 
      WHERE id = ${stepId} AND user_id = ${dbUser.id}
    `
    
    if (stepToDelete.length === 0) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }
    
    const step = stepToDelete[0]
    
    // Check if this is a recurring step template (is_hidden = true, frequency != null)
    const isRecurringTemplate = step.is_hidden === true && step.frequency !== null
    
    if (isRecurringTemplate) {
      // Delete the template and all non-completed instances
      // Keep completed instances (they have completed = true)
      const titlePrefix = step.title
      
      // Delete the template
      await sql`
      DELETE FROM daily_steps 
      WHERE id = ${stepId} AND user_id = ${dbUser.id}
      `
      
      // Delete all non-completed instances (title starts with template title + " - ")
      await sql`
        DELETE FROM daily_steps
        WHERE user_id = ${dbUser.id}
        AND title LIKE ${titlePrefix + ' - %'}
        AND completed = false
      `
      
      return NextResponse.json({ success: true, message: 'Recurring step template and all non-completed instances deleted' })
    } else {
      // This is a regular step or an instance - just delete it
      // If it's an instance, it won't affect other instances
      
      // First, check if this is an instance and if it was completed (before deletion)
      const stepBeforeDelete = await sql`
        SELECT title, completed
        FROM daily_steps
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
      `
      
      if (stepBeforeDelete.length === 0) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }
      
      const stepToDelete = stepBeforeDelete[0]
      const wasInstance = stepToDelete.title && stepToDelete.title.includes(' - ')
      const wasCompleted = stepToDelete.completed === true
      
      // Delete the step
      await sql`
        DELETE FROM daily_steps 
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
      `
      
      // If this was an instance of a recurring step, check if the recurring step should be marked as completed
      // Pass wasInstanceCompleted to indicate if the deleted instance was completed
      if (wasInstance) {
        await checkAndCompleteRecurringStepIfFinished(stepToDelete.title, dbUser.id, wasCompleted)
    }

    return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error deleting daily step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
