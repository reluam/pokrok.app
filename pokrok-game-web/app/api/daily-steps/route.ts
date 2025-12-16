import { NextRequest, NextResponse } from 'next/server'
import { createDailyStep, getDailyStepsByUserId, updateDailyStepFields, updateGoalProgressCombined, getGoalById } from '@/lib/cesta-db'
import { requireAuth, verifyEntityOwnership, verifyOwnership } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

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
            COALESCE(require_checklist_complete, false) as require_checklist_complete
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
    
    // Normalize all date fields to YYYY-MM-DD strings to avoid timezone issues
    const normalizedSteps = steps.map((step) => ({
      ...step,
      date: normalizeDateFromDB(step.date)
    }))
    
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
      requireChecklistComplete
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
    
    // Validate mutual exclusivity: areaId and goalId cannot both be set
    if (areaId && goalId) {
      return NextResponse.json({ 
        error: 'Step cannot have both area and goal assigned',
        details: 'A step must be assigned to either an area or a goal, not both'
      }, { status: 400 })
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
    // If date is provided as YYYY-MM-DD string, use it directly
    // If it's a Date object or ISO string, extract YYYY-MM-DD from it using local date components
    // If no date is provided, use today's date in client's timezone (but we're on server, so use UTC midnight converted)
    let dateValue: string | Date
    if (date) {
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already YYYY-MM-DD format - use directly as string
        // This preserves the client's intended date regardless of server timezone
        dateValue = date
      } else if (typeof date === 'string' && date.includes('T')) {
        // ISO string - extract date part (YYYY-MM-DD) from the ISO string
        // This assumes the ISO string represents the client's local date
        dateValue = date.split('T')[0]
      } else {
        // Date object or other format - convert to YYYY-MM-DD string using local components
        const dateObj = typeof date === 'string' ? new Date(date) : date
        // Use UTC components to preserve the date as intended
        // When client sends ISO string, the date part represents their local date
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

    const stepData = {
      user_id: targetUserId,
      goal_id: normalizedGoalId,
      area_id: normalizedAreaId,
      title,
      description: description || undefined,
      completed: false,
      date: dateValue, // Pass as string (YYYY-MM-DD) or Date, createDailyStep will handle it
      is_important: isImportant || false,
      is_urgent: isUrgent || false,
      aspiration_id: aspirationId || undefined,
      estimated_time: estimatedTime || 30,
      xp_reward: xpReward || 1,
      checklist: checklist || [],
      require_checklist_complete: requireChecklistComplete || false
    }

    const step = await createDailyStep(stepData)
    
    // Normalize date before returning
    const normalizedDate = normalizeDateFromDB(step.date)
    
    const normalizedStep = {
      ...step,
      date: normalizedDate
    }
    
    return NextResponse.json(normalizedStep)
  } catch (error) {
    console.error('Error creating daily step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { stepId, completed, completedAt, title, description, goalId, goal_id, areaId, aspirationId, aspiration_id, isImportant, isUrgent, estimatedTime, xpReward, date, checklist, requireChecklistComplete } = body
    
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
    
    // Validate mutual exclusivity: areaId and goalId cannot both be set
    if (areaId && (goalId || goal_id)) {
      return NextResponse.json({ 
        error: 'Step cannot have both area and goal assigned',
        details: 'A step must be assigned to either an area or a goal, not both'
      }, { status: 400 })
    }
    
    // Check what type of update this is
    const isCompletionOnly = completed !== undefined && title === undefined && date === undefined
    const isDateOnly = date !== undefined && title === undefined && completed === undefined
    
    if (isCompletionOnly) {
      // This is a completion toggle
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
          COALESCE(require_checklist_complete, false) as require_checklist_complete
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
    const result = await sql`
      DELETE FROM daily_steps 
      WHERE id = ${stepId} AND user_id = ${dbUser.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting daily step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
