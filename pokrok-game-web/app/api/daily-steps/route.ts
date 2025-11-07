import { NextRequest, NextResponse } from 'next/server'
import { createDailyStep, getDailyStepsByUserId, updateDailyStepFields } from '@/lib/cesta-db'

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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const goalId = searchParams.get('goalId')
    
    // Support both userId and goalId queries
    if (goalId) {
      // Get steps for a specific goal
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')
      
      const steps = await sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, 
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
        FROM daily_steps
        WHERE goal_id = ${goalId}
        ORDER BY created_at DESC
      `
      
      const normalizedSteps = steps.map((step: any) => ({
        ...step,
        date: normalizeDateFromDB(step.date)
      }))
      
      return NextResponse.json(normalizedSteps)
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get daily steps for user with optional date filtering
    let steps
    if (startDate && endDate) {
      // Date range query (optimized)
      steps = await getDailyStepsByUserId(userId, undefined, startDate, endDate)
    } else if (date) {
      // Single date query
      steps = await getDailyStepsByUserId(userId, new Date(date))
    } else {
      // All steps (fallback - should be avoided for performance)
      steps = await getDailyStepsByUserId(userId)
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
    const body = await request.json()
    const { 
      userId, 
      goalId, 
      title, 
      description, 
      date, 
      isImportant, 
      isUrgent, 
      aspirationId,
      estimatedTime,
      xpReward
    } = body
    
    if (!userId || !title) {
      return NextResponse.json({ 
        error: 'User ID and title are required',
        details: { hasUserId: !!userId, hasTitle: !!title }
      }, { status: 400 })
    }

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
      user_id: userId,
      goal_id: goalId || null,
      title,
      description: description || undefined,
      completed: false,
      date: dateValue, // Pass as string (YYYY-MM-DD) or Date, createDailyStep will handle it
      is_important: isImportant || false,
      is_urgent: isUrgent || false,
      aspiration_id: aspirationId || undefined,
      estimated_time: estimatedTime || 30,
      xp_reward: xpReward || 1
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
    const body = await request.json()
    const { stepId, completed, completedAt, title, description, goalId, goal_id, aspirationId, aspiration_id, isImportant, isUrgent, estimatedTime, xpReward, date } = body
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    // Update step completion status
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')
    
    // Check what type of update this is
    const isCompletionOnly = completed !== undefined && title === undefined && date === undefined
    const isDateOnly = date !== undefined && title === undefined && completed === undefined
    
    if (isCompletionOnly) {
      // This is a completion toggle
      // Return date as YYYY-MM-DD string using TO_CHAR
      const result = await sql`
        UPDATE daily_steps 
        SET 
          completed = ${completed},
          completed_at = ${completedAt ? new Date(completedAt) : null},
          updated_at = NOW()
        WHERE id = ${stepId}
        RETURNING 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, 
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
    } else if (isDateOnly) {
      // This is a date-only update (from drag & drop)
      // Use SQL DATE() function to ensure date-only storage
      if (date) {
        // Use CAST to ensure date-only storage without time component
        // Return date as YYYY-MM-DD string using TO_CHAR
        const result = await sql`
          UPDATE daily_steps 
          SET 
            date = CAST(${date}::text AS DATE),
            updated_at = NOW()
          WHERE id = ${stepId}
          RETURNING 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, 
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
        const result = await sql`
          UPDATE daily_steps 
          SET 
            date = NULL,
            updated_at = NOW()
          WHERE id = ${stepId}
          RETURNING 
            id, user_id, goal_id, title, description, completed, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            is_important, is_urgent, aspiration_id, 
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
      if (goalId !== undefined || goal_id !== undefined) {
        updates.goal_id = goalId || goal_id || null
      }
      if (aspirationId !== undefined || aspiration_id !== undefined) {
        updates.aspiration_id = aspirationId || aspiration_id || null
      }
      if (isImportant !== undefined) updates.is_important = isImportant
      if (isUrgent !== undefined) updates.is_urgent = isUrgent
      if (estimatedTime !== undefined) updates.estimated_time = estimatedTime
      if (xpReward !== undefined) updates.xp_reward = xpReward
      if (date !== undefined) updates.date = dateValue

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
      }

      const updatedStep = await updateDailyStepFields(stepId, updates)

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
    const { searchParams } = new URL(request.url)
    const stepId = searchParams.get('stepId')
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')
    
    const result = await sql`
      DELETE FROM daily_steps 
      WHERE id = ${stepId}
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
