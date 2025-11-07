import { NextRequest, NextResponse } from 'next/server'
import { createDailyStep, getDailyStepsByUserId } from '@/lib/cesta-db'

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
          is_important, is_urgent, step_type, custom_type_name, 
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

    // Get daily steps for user, optionally filtered by date
    const steps = await getDailyStepsByUserId(userId, date ? new Date(date) : undefined)
    
    // Debug: log first step's date to see what PostgreSQL returns
    if (steps.length > 0) {
      console.log('GET /api/daily-steps - First step raw date:', steps[0].date, 'type:', typeof steps[0].date)
    }
    
    // Normalize all date fields to YYYY-MM-DD strings to avoid timezone issues
    const normalizedSteps = steps.map((step, index) => {
      const normalizedDate = normalizeDateFromDB(step.date)
      if (index === 0) {
        console.log('GET /api/daily-steps - First step normalized date:', normalizedDate)
      }
      return {
        ...step,
        date: normalizedDate
      }
    })
    
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
      stepType,
      customTypeName,
      estimatedTime,
      xpReward
    } = body
    
    // Log request body for debugging
    console.log('POST /api/daily-steps - Request body:', JSON.stringify(body, null, 2))
    
    if (!userId || !title) {
      console.error('POST /api/daily-steps - Validation failed:', { userId: !!userId, title: !!title, body })
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
      step_type: stepType || 'custom',
      custom_type_name: customTypeName || undefined,
      estimated_time: estimatedTime || 30,
      xp_reward: xpReward || 1
    }

    const step = await createDailyStep(stepData)
    
    console.log('POST /api/daily-steps - Date received from client:', date)
    console.log('POST /api/daily-steps - DateValue processed:', dateValue)
    console.log('POST /api/daily-steps - Step from DB (raw date):', step.date, 'type:', typeof step.date)
    
    // Normalize date before returning
    const normalizedDate = normalizeDateFromDB(step.date)
    console.log('POST /api/daily-steps - Normalized date:', normalizedDate)
    
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
    console.log('PUT /api/daily-steps - Request body:', body)
    
    const { stepId, completed, completedAt, title, description, goalId, isImportant, isUrgent, estimatedTime, xpReward, date } = body
    
    if (!stepId) {
      console.log('PUT /api/daily-steps - Missing stepId')
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    console.log('PUT /api/daily-steps - Processing stepId:', stepId)
    console.log('PUT /api/daily-steps - Fields:', { title, description, goalId, isImportant, isUrgent, estimatedTime, xpReward })

    // Update step completion status
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')
    
    // Check what type of update this is
    const isCompletionOnly = completed !== undefined && title === undefined && date === undefined
    const isDateOnly = date !== undefined && title === undefined && completed === undefined
    
    if (isCompletionOnly) {
      console.log('PUT /api/daily-steps - This is a completion toggle')
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
          is_important, is_urgent, step_type, custom_type_name, 
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
      `
      
      if (result.length === 0) {
        console.log('PUT /api/daily-steps - Step not found for completion toggle')
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }
      
      console.log('PUT /api/daily-steps - Completion toggle successful:', result[0])
      const normalizedResult = {
        ...result[0],
        date: normalizeDateFromDB(result[0].date)
      }
      return NextResponse.json(normalizedResult)
    } else if (isDateOnly) {
      console.log('PUT /api/daily-steps - This is a date-only update (drag & drop)')
      console.log('PUT /api/daily-steps - Date value received:', date)
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
            is_important, is_urgent, step_type, custom_type_name, 
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
        `
        
        if (result.length === 0) {
          console.log('PUT /api/daily-steps - Step not found for date update')
          return NextResponse.json({ error: 'Step not found' }, { status: 404 })
        }
        
        console.log('PUT /api/daily-steps - Date update successful:', result[0])
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
            is_important, is_urgent, step_type, custom_type_name, 
            estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
        `
        
        if (result.length === 0) {
          console.log('PUT /api/daily-steps - Step not found for date update')
          return NextResponse.json({ error: 'Step not found' }, { status: 404 })
        }
        
        console.log('PUT /api/daily-steps - Date cleared successfully:', result[0])
        const normalizedResult = {
          ...result[0],
          date: normalizeDateFromDB(result[0].date)
        }
        return NextResponse.json(normalizedResult)
      }
    } else {
      console.log('PUT /api/daily-steps - This is a full update (edit form)')
      // This is a full update (edit form)
      // Build dynamic update query using template literals
      const updateParts = []
      const updateValues: any[] = []
      
      if (title !== undefined) {
        updateParts.push(`title = $${updateParts.length + 1}`)
        updateValues.push(title || null)
      }
      if (description !== undefined) {
        updateParts.push(`description = $${updateParts.length + 1}`)
        updateValues.push(description || null)
      }
      if (goalId !== undefined) {
        updateParts.push(`goal_id = $${updateParts.length + 1}`)
        updateValues.push(goalId || null)
      }
      if (isImportant !== undefined) {
        updateParts.push(`is_important = $${updateParts.length + 1}`)
        updateValues.push(isImportant || false)
      }
      if (isUrgent !== undefined) {
        updateParts.push(`is_urgent = $${updateParts.length + 1}`)
        updateValues.push(isUrgent || false)
      }
      if (estimatedTime !== undefined) {
        updateParts.push(`estimated_time = $${updateParts.length + 1}`)
        updateValues.push(estimatedTime || 30)
      }
      if (xpReward !== undefined) {
        updateParts.push(`xp_reward = $${updateParts.length + 1}`)
        updateValues.push(xpReward || 1)
      }
      if (date !== undefined) {
        // Format date as YYYY-MM-DD string for PostgreSQL DATE type
        if (date) {
          // Ensure date is in YYYY-MM-DD format, parsing as local date to avoid timezone issues
          let dateStr = date
          if (dateStr instanceof Date) {
            // Use local date components to avoid timezone issues
            const year = dateStr.getFullYear()
            const month = String(dateStr.getMonth() + 1).padStart(2, '0')
            const day = String(dateStr.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          } else if (typeof dateStr === 'string') {
            if (dateStr.includes('T')) {
              // ISO format with time - extract date part and parse as local
              const datePart = dateStr.split('T')[0]
              const [year, month, day] = datePart.split('-').map(Number)
              const localDate = new Date(year, month - 1, day)
              dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`
            } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Already in YYYY-MM-DD format, use as is
              dateStr = dateStr
            }
          }
          // Use parameterized query - PostgreSQL will auto-cast YYYY-MM-DD string to DATE
          const paramIndex = updateParts.length + 1
          updateParts.push(`date = $${paramIndex}`)
          updateValues.push(dateStr)
        } else {
          updateParts.push(`date = $${updateParts.length + 1}`)
          updateValues.push(null)
        }
      }
      
      if (updateParts.length === 0) {
        console.log('PUT /api/daily-steps - No fields to update')
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
      }
      
      // Build query string with parameterized placeholders
      // sql.unsafe() takes only the query string, so we need to include values directly
      // But we'll use PostgreSQL parameterized query format for safety
      // Return date as YYYY-MM-DD string using TO_CHAR
      const query = `UPDATE daily_steps SET ${updateParts.join(', ')}, updated_at = NOW() WHERE id = $${updateValues.length + 1} RETURNING id, user_id, goal_id, title, description, completed, TO_CHAR(date, 'YYYY-MM-DD') as date, is_important, is_urgent, step_type, custom_type_name, estimated_time, xp_reward, deadline, completed_at, created_at, updated_at`
      updateValues.push(stepId)
      
      // Escape and format values for safe insertion
      const formattedQuery = query.replace(/\$(\d+)/g, (match, index) => {
        const valueIndex = parseInt(index) - 1
        if (valueIndex < 0 || valueIndex >= updateValues.length) {
          return match
        }
        const value = updateValues[valueIndex]
        if (value === null || value === undefined) {
          return 'NULL'
        }
        if (typeof value === 'string') {
          // Escape single quotes for SQL safety
          const escaped = value.replace(/'/g, "''")
          return `'${escaped}'`
        }
        if (typeof value === 'boolean') {
          return value ? 'true' : 'false'
        }
        if (typeof value === 'number') {
          return value.toString()
        }
        if (value instanceof Date) {
          return `'${value.toISOString()}'`
        }
        return `'${String(value).replace(/'/g, "''")}'`
      })
      
      console.log('PUT /api/daily-steps - Full update query:', formattedQuery)
      
      const result = await sql.unsafe(formattedQuery) as unknown as any[]

      if (result.length === 0) {
        console.log('PUT /api/daily-steps - Step not found for full update')
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }

      console.log('PUT /api/daily-steps - Full update successful:', result[0])
      const normalizedResult = {
        ...result[0],
        date: normalizeDateFromDB(result[0].date)
      }
      return NextResponse.json(normalizedResult)
    }
  } catch (error: any) {
    console.error('PUT /api/daily-steps - Error updating daily step:', error)
    const errorMessage = error?.message || 'Internal server error'
    console.error('PUT /api/daily-steps - Error details:', errorMessage)
    return NextResponse.json({ error: errorMessage, details: error?.stack }, { status: 500 })
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
