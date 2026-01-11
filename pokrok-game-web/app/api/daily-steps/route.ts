import { NextRequest, NextResponse } from 'next/server'
import { createDailyStep, getDailyStepsByUserId, updateDailyStepFields, updateGoalProgressCombined, getGoalById } from '@/lib/cesta-db'
import { requireAuth, verifyEntityOwnership, verifyOwnership } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isStepScheduledForDay } from '@/app/[locale]/planner/components/utils/stepHelpers'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Helper function to calculate the next occurrence date for a recurring step
// Returns the next date from startDate onwards where the step should be scheduled
// Never returns dates in the past (returns today or future dates only)
function calculateNextRecurringDate(step: any, startDate: Date = new Date()): Date | null {
  if (!step.frequency || step.frequency === null) {
    return null
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Ensure startDate is at least today (never go back in time)
  const searchStartDate = startDate < today ? new Date(today) : new Date(startDate)
  searchStartDate.setHours(0, 0, 0, 0)
  
  // Check recurring_start_date - don't return dates before it
  let actualStartDate = searchStartDate
  if (step.recurring_start_date) {
    const recurringStart = new Date(step.recurring_start_date)
    recurringStart.setHours(0, 0, 0, 0)
    if (recurringStart > actualStartDate) {
      actualStartDate = recurringStart
    }
  }
  
  // Check recurring_end_date - don't return dates after it
  let endDate: Date | null = null
  if (step.recurring_end_date) {
    endDate = new Date(step.recurring_end_date)
    endDate.setHours(23, 59, 59, 999)
  }
  
  let currentDate = new Date(actualStartDate)
  
  // Search up to 365 days ahead
  for (let i = 0; i < 365; i++) {
    // Check if we've exceeded end date
    if (endDate && currentDate > endDate) {
      return null
    }
    
    // Check if step is scheduled for this day
    if (isStepScheduledForDay(step, currentDate)) {
      return currentDate
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return null
}

// OLD Helper function to create instance from recurring step - DEPRECATED
// Keeping for backwards compatibility but will be removed
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
            COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
            COALESCE(require_checklist_complete, false) as require_checklist_complete,
            frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
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
    const apiStartTime = Date.now()
    let steps
    if (startDate && endDate) {
      // Date range query (optimized)
      console.log(`[API Performance] Fetching steps for range: ${startDate} to ${endDate}`)
      steps = await getDailyStepsByUserId(targetUserId, undefined, startDate, endDate)
    } else if (date) {
      // Single date query
      console.log(`[API Performance] Fetching steps for date: ${date}`)
      steps = await getDailyStepsByUserId(targetUserId, new Date(date))
    } else {
      // All steps (fallback - should be avoided for performance)
      console.log('[API Performance] WARNING: Fetching ALL steps (no date filter)')
      steps = await getDailyStepsByUserId(targetUserId)
    }
    
    const apiTime = Date.now() - apiStartTime
    console.log(`[API Performance] getDailyStepsByUserId returned ${steps.length} steps in ${apiTime}ms`)
    
    // Log to client via response headers for debugging (if needed)
    // Note: Server-side console.log appears in server logs, not browser console
    
    // PERFORMANCE OPTIMIZATION: Removed automatic instance creation for OLD recurring steps during GET
    // This was causing significant slowdown (1-3 seconds) on every request
    // TODO: Move instance creation to:
    //   1. Background job (cron) - recommended
    //   2. On-demand when user views recurring step details
    //   3. When recurring step is created/updated
    // OLD recurring steps system (is_hidden = true) should be migrated to new system
    // NEW recurring steps use current_instance_date and don't need separate instances
    
    // Normalize all date fields to YYYY-MM-DD strings to avoid timezone issues
    const normalizeStartTime = Date.now()
    let normalizedSteps = steps.map((step) => ({
      ...step,
      date: normalizeDateFromDB(step.date)
    }))
    const normalizeTime = Date.now() - normalizeStartTime
    console.log(`[API Performance] Normalized ${normalizedSteps.length} steps in ${normalizeTime}ms`)
    
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
    
    // Validate recurring step data before saving
    if (frequency && frequency !== null) {
      // For weekly and monthly, selectedDays must be provided and not empty
      if (frequency === 'weekly' || frequency === 'monthly') {
        if (!selectedDays || !Array.isArray(selectedDays) || selectedDays.length === 0) {
          return NextResponse.json({ 
            error: 'Invalid recurring step configuration',
            details: `Recurring step with frequency '${frequency}' must have at least one selected day`
          }, { status: 400 })
        }
      }
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

    // For recurring steps, calculate the next occurrence date (current_instance_date)
    let currentInstanceDate: string | null = null
    if (frequency) {
      const stepForCalculation = {
        frequency,
        selected_days: selectedDays || [],
        recurring_start_date: recurringStartDateValue,
        recurring_end_date: recurringEndDateValue
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = recurringStartDateValue ? new Date(recurringStartDateValue) : today
      startDate.setHours(0, 0, 0, 0)
      
      // Ensure start date is at least today (never go back in time)
      const actualStartDate = startDate < today ? today : startDate
      
      const nextDate = calculateNextRecurringDate(stepForCalculation, actualStartDate)
      if (nextDate) {
        const year = nextDate.getFullYear()
        const month = String(nextDate.getMonth() + 1).padStart(2, '0')
        const day = String(nextDate.getDate()).padStart(2, '0')
        currentInstanceDate = `${year}-${month}-${day}`
      }
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
      is_hidden: false, // NEW: Recurring steps are NOT hidden - they're visible with current_instance_date
      current_instance_date: currentInstanceDate // NEW: Set the next occurrence date
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
    
    // Recurring steps are now normal steps with current_instance_date - no separate instances are created
    // The step itself is displayed according to current_instance_date
    
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
    const { stepId, completed, completedAt, completionDate, title, description, goalId, goal_id, areaId, aspirationId, aspiration_id, isImportant, is_important, isUrgent, estimatedTime, xpReward, date, checklist, requireChecklistComplete, frequency, selectedDays, recurringStartDate, recurringEndDate, lastInstanceDate, finishRecurring } = body
    // Normalize is_important - support both camelCase and snake_case
    const normalizedIsImportant = isImportant !== undefined ? isImportant : (is_important !== undefined ? is_important : undefined)
    
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
    const isCompletionOnly = completed !== undefined && title === undefined && date === undefined && finishRecurring === undefined && normalizedIsImportant === undefined
    const isDateOnly = date !== undefined && title === undefined && completed === undefined && finishRecurring === undefined && normalizedIsImportant === undefined
    const isImportantOnly = normalizedIsImportant !== undefined && title === undefined && date === undefined && completed === undefined && finishRecurring === undefined
    const isFinishRecurring = finishRecurring === true
    
    if (isCompletionOnly) {
      // First, get the current step to check if it's recurring
      const currentStepResult = await sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
            COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
          COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
          TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
          TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date,
          TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
          TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
          recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
          TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
        FROM daily_steps
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
      `
      
      if (currentStepResult.length === 0) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }
      
      const currentStep = currentStepResult[0]
      
      // NEW: If this is a recurring step being completed, update current_instance_date to next occurrence
      if (completed && currentStep.frequency && currentStep.frequency !== null) {
        // Determine completion date (use current_instance_date, date, or current date)
        // For recurring steps with future dates, we want to use the scheduled date (current_instance_date or date)
        // as the completion date value, not the actual completion date (today)
        let completionDateValue: string
        console.log(`[Recurring step completion] Step ${stepId}: completionDate=${completionDate}, current_instance_date=${currentStep.current_instance_date}, date=${currentStep.date}`)
        if (completionDate) {
          // Use provided completion date (this is the scheduled date from frontend)
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
          console.log(`[Recurring step completion] Step ${stepId}: Using provided completionDate, completionDateValue=${completionDateValue}`)
        } else if (currentStep.current_instance_date) {
          // Use current_instance_date if available (this is the scheduled date for this instance)
          completionDateValue = currentStep.current_instance_date
        } else if (currentStep.date) {
          // Check if date is in the future
          const stepDateObj = new Date(currentStep.date)
          stepDateObj.setHours(0, 0, 0, 0)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (stepDateObj > today) {
            // If current_instance_date is not set, but date is in the future, use date as the scheduled date
            // This handles the case where recurring step has date set to future but current_instance_date is null
            completionDateValue = currentStep.date
          } else {
            // Date is not in the future, use today
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
        
        // Check if step has a future date (completionDateValue is the scheduled date for this instance)
        // This happens when user completes a recurring step that was scheduled for a future date
        // completionDateValue should be the scheduled date (current_instance_date or date), not today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const completionDateObjForCheck = new Date(completionDateValue)
        completionDateObjForCheck.setHours(0, 0, 0, 0)
        
        // Step has future date if completionDateValue (scheduled date) is in the future
        // This means user completed a step that was scheduled for a future date
        const hasFutureDate = completionDateObjForCheck > today
        
        console.log(`[Recurring step completion] Step ${stepId}: hasFutureDate=${hasFutureDate}, current_instance_date=${currentStep.current_instance_date}, date=${currentStep.date}, completionDateValue=${completionDateValue}, today=${today.toISOString().split('T')[0]}, completionDateObjForCheck=${completionDateObjForCheck.toISOString().split('T')[0]}`)
        
        // Calculate next occurrence date (starting from completion date + 1 day, never in the past)
        // Parse completionDateValue as YYYY-MM-DD to avoid timezone issues
        const [year, month, day] = completionDateValue.split('-').map(Number)
        const completionDateObj = new Date(year, month - 1, day)
        completionDateObj.setHours(0, 0, 0, 0)
        const nextSearchDate = new Date(completionDateObj)
        nextSearchDate.setDate(nextSearchDate.getDate() + 1)
        nextSearchDate.setHours(0, 0, 0, 0)
        
        console.log(`[Recurring step completion] Step ${stepId}: completionDateValue=${completionDateValue}, nextSearchDate=${nextSearchDate.getFullYear()}-${String(nextSearchDate.getMonth() + 1).padStart(2, '0')}-${String(nextSearchDate.getDate()).padStart(2, '0')}, frequency=${currentStep.frequency}, selected_days=${JSON.stringify(currentStep.selected_days)}`)
        
        const nextOccurrenceDate = calculateNextRecurringDate(currentStep, nextSearchDate)
        let nextOccurrenceDateStr: string | null = null
        if (nextOccurrenceDate) {
          const year = nextOccurrenceDate.getFullYear()
          const month = String(nextOccurrenceDate.getMonth() + 1).padStart(2, '0')
          const day = String(nextOccurrenceDate.getDate()).padStart(2, '0')
          nextOccurrenceDateStr = `${year}-${month}-${day}`
          console.log(`[Recurring step completion] Step ${stepId}: nextOccurrenceDateStr=${nextOccurrenceDateStr}`)
        } else {
          console.log(`[Recurring step completion] Step ${stepId}: No next occurrence date found`)
        }
        
        // If there's no next occurrence and recurring_end_date is set, mark the step as completed
        // This means the user completed the last occurrence of the recurring step
        const hasRecurringEndDate = currentStep.recurring_end_date !== null && currentStep.recurring_end_date !== undefined
        const shouldMarkCompleted = !nextOccurrenceDateStr && hasRecurringEndDate
        
        // Set completed_at to today (when it was actually completed)
        const todayStr = today.toISOString().split('T')[0]
        const completedAtTimestamp = completedAt ? new Date(completedAt) : new Date()
        
        // Update the recurring step: if it has a future date, set date to next occurrence
        // Otherwise, use the normal recurring step completion logic
        console.log(`[Recurring step completion - before update] Step ${stepId}: hasFutureDate=${hasFutureDate}, nextOccurrenceDateStr=${nextOccurrenceDateStr}, completionDateValue=${completionDateValue}`)
        
        if (hasFutureDate && nextOccurrenceDateStr) {
          // Step has a future date (was scheduled for future) - set date to next occurrence
          // This means user completed a future instance early (e.g., completed tomorrow's step today)
          console.log(`[Recurring step completion with future date] Step ${stepId}: Setting date to ${nextOccurrenceDateStr}, last_completed_instance_date to ${completionDateValue}`)
          const updateResult = await sql`
            UPDATE daily_steps
            SET 
              completed = false,
              date = CAST(${nextOccurrenceDateStr} AS DATE),
              current_instance_date = CAST(${nextOccurrenceDateStr} AS DATE),
              last_completed_instance_date = CAST(${completionDateValue} AS DATE),
              completed_at = ${completedAtTimestamp},
              updated_at = NOW()
            WHERE id = ${stepId} AND user_id = ${dbUser.id}
          `
          console.log(`[Recurring step completion with future date] Step ${stepId}: SQL UPDATE completed`)
        } else if (nextOccurrenceDateStr) {
          // Normal recurring step completion - update both current_instance_date and date
          // Even if hasFutureDate is false, we should still update date to next occurrence for consistency
          console.log(`[Recurring step completion - normal] Step ${stepId}: Setting date to ${nextOccurrenceDateStr}, last_completed_instance_date to ${completionDateValue}`)
          const updateResult = await sql`
            UPDATE daily_steps
            SET 
              completed = false,
              date = CAST(${nextOccurrenceDateStr} AS DATE),
              current_instance_date = CAST(${nextOccurrenceDateStr} AS DATE),
              last_completed_instance_date = CAST(${completionDateValue} AS DATE),
              updated_at = NOW()
            WHERE id = ${stepId} AND user_id = ${dbUser.id}
          `
          console.log(`[Recurring step completion - normal] Step ${stepId}: SQL UPDATE completed`)
        } else if (shouldMarkCompleted) {
          // No next occurrence and has recurring_end_date - mark as completed
          // Set date field to completionDateValue so the step has a date
          // completed_at is already set above to today (when it was actually completed)
          await sql`
            UPDATE daily_steps
            SET 
              completed = true,
              date = CAST(${completionDateValue} AS DATE),
              current_instance_date = NULL,
              last_completed_instance_date = CAST(${completionDateValue} AS DATE),
              completed_at = ${completedAtTimestamp},
              updated_at = NOW()
            WHERE id = ${stepId} AND user_id = ${dbUser.id}
          `
        } else {
          // No next occurrence but no recurring_end_date - just set current_instance_date to NULL
          await sql`
            UPDATE daily_steps
            SET 
              completed = false,
              current_instance_date = NULL,
              last_completed_instance_date = CAST(${completionDateValue} AS DATE),
              updated_at = NOW()
            WHERE id = ${stepId} AND user_id = ${dbUser.id}
          `
        }
        
        // Fetch updated step
        const updatedStepResult = await sql`
          SELECT 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
            COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
            COALESCE(require_checklist_complete, false) as require_checklist_complete,
            frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
            TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
            TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
            recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
            TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
          FROM daily_steps
          WHERE id = ${stepId} AND user_id = ${dbUser.id}
        `
        
        const updatedStep = updatedStepResult[0]
        console.log(`[Recurring step completion] Step ${stepId}: After UPDATE, date=${updatedStep.date}, current_instance_date=${updatedStep.current_instance_date}`)
        
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
            COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
            COALESCE(require_checklist_complete, false) as require_checklist_complete,
            frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
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
      // If step is being completed and has a future date, preserve the date (don't change it to today)
      // The date represents when the step was scheduled, completed_at represents when it was actually completed
      
      // Check if step has a future date that should be preserved
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const stepDate = currentStep.date ? new Date(currentStep.date) : null
      const hasFutureDate = stepDate && stepDate > today
      
      // If completing a step with a future date, preserve the date and set completed_at to today
      // If uncompleting or step doesn't have a future date, use normal update
      let completedAtValue: Date | null = null
      if (completed) {
        if (completedAt) {
          completedAtValue = new Date(completedAt)
        } else {
          // Set completed_at to today (when it was actually completed), regardless of step's date
          completedAtValue = new Date()
        }
      }
      
      // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
      const result = await sql`
        UPDATE daily_steps 
        SET 
          completed = ${completed},
          completed_at = ${completedAtValue},
          updated_at = NOW()
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
        RETURNING 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
            COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
          COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
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
    }
    
    // NEW: Handle finishing a recurring step (sets recurring_end_date to today and current_instance_date to NULL)
    // This must be checked separately from isCompletionOnly
    if (isFinishRecurring) {
      // First, get the current step to check if it's recurring
      const currentStepResult = await sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
          COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
          COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
          TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
          TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
          recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
          TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
        FROM daily_steps
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
      `
      
      if (currentStepResult.length === 0) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }
      
      const currentStep = currentStepResult[0]
      
      if (currentStep.frequency && currentStep.frequency !== null) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        
        // Update recurring step: set recurring_end_date to today, mark as completed, set date to today
        const completedAtTimestamp = `${todayStr} 23:59:59`
        await sql`
          UPDATE daily_steps
          SET 
            completed = true,
            date = CAST(${todayStr} AS DATE),
            recurring_end_date = CAST(${todayStr} AS DATE),
            current_instance_date = NULL,
            completed_at = CAST(${completedAtTimestamp} AS TIMESTAMP),
            updated_at = NOW()
          WHERE id = ${stepId} AND user_id = ${dbUser.id}
        `
        
        // Fetch updated step
        const finishedStepResult = await sql`
          SELECT 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, area_id,
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
            COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
            COALESCE(require_checklist_complete, false) as require_checklist_complete,
            frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
            TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
            TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
            recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
            TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
          FROM daily_steps
          WHERE id = ${stepId} AND user_id = ${dbUser.id}
        `
        
        const finishedStep = finishedStepResult[0]
        
        const normalizedResult = {
          ...finishedStep,
          date: normalizeDateFromDB(finishedStep.date)
        }
        
        return NextResponse.json(normalizedResult)
      } else {
        return NextResponse.json({ error: 'Step is not a recurring step' }, { status: 400 })
      }
    }
    
    // Check if this is an importance-only update
    if (isImportantOnly) {
      // This is an importance-only update (from star icon click)
      const result = await sql`
        UPDATE daily_steps 
        SET 
          is_important = ${normalizedIsImportant},
          updated_at = NOW()
        WHERE id = ${stepId} AND user_id = ${dbUser.id}
        RETURNING 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
          COALESCE(checklist, CAST('[]' AS jsonb)) as checklist,
          COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
          TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
          TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
          recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
          TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
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
    
    // Check if this is a date-only update
    if (isDateOnly) {
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
      if (normalizedIsImportant !== undefined) updates.is_important = normalizedIsImportant
      if (isUrgent !== undefined) updates.is_urgent = isUrgent
      if (estimatedTime !== undefined) updates.estimated_time = estimatedTime
      if (xpReward !== undefined) updates.xp_reward = xpReward
      if (date !== undefined) updates.date = dateValue
      if (checklist !== undefined) updates.checklist = checklist
      if (requireChecklistComplete !== undefined) updates.require_checklist_complete = requireChecklistComplete
      
      // Validate recurring step data before saving
      // Get current step data to use for calculations
      let currentStepForRecurring: any = null
      const needsRecurringCalculation = frequency !== undefined || selectedDays !== undefined || recurringStartDate !== undefined || recurringEndDate !== undefined
      if (needsRecurringCalculation) {
        const currentStepResult = await sql`
          SELECT 
            frequency, 
            COALESCE(selected_days, CAST('[]' AS jsonb)) as selected_days,
            TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
            TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date
          FROM daily_steps
          WHERE id = ${stepId} AND user_id = ${dbUser.id}
        `
        if (currentStepResult.length > 0) {
          currentStepForRecurring = currentStepResult[0]
        }
      }
      
      if (frequency !== undefined) {
        const finalFrequency = frequency || null
        const finalSelectedDays = selectedDays !== undefined ? (selectedDays || []) : (currentStepForRecurring?.selected_days || [])
        
        // If frequency is set (recurring step), validate that it has required fields
        if (finalFrequency && finalFrequency !== null) {
          // For weekly and monthly, selectedDays must be provided and not empty
          if (finalFrequency === 'weekly' || finalFrequency === 'monthly') {
            // If selectedDays is being updated, check if it's empty
            if (selectedDays !== undefined && (!Array.isArray(finalSelectedDays) || finalSelectedDays.length === 0)) {
              return NextResponse.json({ 
                error: 'Invalid recurring step configuration',
                details: `Recurring step with frequency '${finalFrequency}' must have at least one selected day`
              }, { status: 400 })
            }
            // If selectedDays is not being updated, check current value in DB
            if (selectedDays === undefined && currentStepForRecurring) {
              const currentSelectedDays = currentStepForRecurring.selected_days
              if (!Array.isArray(currentSelectedDays) || currentSelectedDays.length === 0) {
                return NextResponse.json({ 
                  error: 'Invalid recurring step configuration',
                  details: `Recurring step with frequency '${finalFrequency}' must have at least one selected day`
                }, { status: 400 })
              }
            }
          }
        }
        
        updates.frequency = finalFrequency
        if (selectedDays !== undefined) {
          updates.selected_days = finalSelectedDays
        }
      } else if (selectedDays !== undefined) {
        // If only selectedDays is being updated, check if step is recurring
        if (currentStepForRecurring) {
          const currentFrequency = currentStepForRecurring.frequency
          const newSelectedDays = selectedDays || []
          
          // If step is recurring with weekly/monthly frequency, validate selectedDays
          if (currentFrequency === 'weekly' || currentFrequency === 'monthly') {
            if (!Array.isArray(newSelectedDays) || newSelectedDays.length === 0) {
              return NextResponse.json({ 
                error: 'Invalid recurring step configuration',
                details: `Recurring step with frequency '${currentFrequency}' must have at least one selected day`
              }, { status: 400 })
            }
          }
        }
        
        updates.selected_days = selectedDays || []
      }
      
      // Handle recurring start/end dates
      if (recurringStartDate !== undefined) {
        let recurringStartDateValue: string | null = null
        if (recurringStartDate && typeof recurringStartDate === 'string' && recurringStartDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          recurringStartDateValue = recurringStartDate
        }
        updates.recurring_start_date = recurringStartDateValue
      }
      
      if (recurringEndDate !== undefined) {
        let recurringEndDateValue: string | null = null
        if (recurringEndDate && typeof recurringEndDate === 'string' && recurringEndDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          recurringEndDateValue = recurringEndDate
        } else if (recurringEndDate === null || recurringEndDate === '') {
          recurringEndDateValue = null
        }
        updates.recurring_end_date = recurringEndDateValue
      }
      
      // Calculate current_instance_date if recurring settings are being updated
      if (needsRecurringCalculation) {
        const finalFrequency = updates.frequency !== undefined ? updates.frequency : (currentStepForRecurring?.frequency || null)
        const finalSelectedDays = updates.selected_days !== undefined ? updates.selected_days : (currentStepForRecurring?.selected_days || [])
        const finalRecurringStartDate = updates.recurring_start_date !== undefined ? updates.recurring_start_date : (currentStepForRecurring?.recurring_start_date || null)
        const finalRecurringEndDate = updates.recurring_end_date !== undefined ? updates.recurring_end_date : (currentStepForRecurring?.recurring_end_date || null)
        
        // Only calculate if step is or will be recurring
        if (finalFrequency && finalFrequency !== null) {
          const stepForCalculation = {
            frequency: finalFrequency,
            selected_days: Array.isArray(finalSelectedDays) ? finalSelectedDays : [],
            recurring_start_date: finalRecurringStartDate,
            recurring_end_date: finalRecurringEndDate
          }
          
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const startDate = finalRecurringStartDate ? new Date(finalRecurringStartDate) : today
          startDate.setHours(0, 0, 0, 0)
          
          // Ensure start date is at least today (never go back in time)
          const actualStartDate = startDate < today ? today : startDate
          
          const nextDate = calculateNextRecurringDate(stepForCalculation, actualStartDate)
          if (nextDate) {
            const year = nextDate.getFullYear()
            const month = String(nextDate.getMonth() + 1).padStart(2, '0')
            const day = String(nextDate.getDate()).padStart(2, '0')
            updates.current_instance_date = `${year}-${month}-${day}`
          } else {
            // No next occurrence - set to null
            updates.current_instance_date = null
          }
        } else if (finalFrequency === null) {
          // Step is no longer recurring - clear current_instance_date
          updates.current_instance_date = null
        }
      }

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

      // Recurring steps are now normal steps with current_instance_date - no separate instances are created
      // The step itself is displayed according to current_instance_date

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
