import { NextRequest, NextResponse } from 'next/server'
import { createDailyStep, getDailyStepsByUserId } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get daily steps for user, optionally filtered by date
    const steps = await getDailyStepsByUserId(userId, date ? new Date(date) : undefined)
    return NextResponse.json(steps)
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
    
    if (!userId || !title) {
      return NextResponse.json({ error: 'User ID and title are required' }, { status: 400 })
    }

    const stepData = {
      user_id: userId,
      goal_id: goalId || null,
      title,
      description: description || undefined,
      completed: false,
      date: date ? new Date(date) : new Date(),
      is_important: isImportant || false,
      is_urgent: isUrgent || false,
      step_type: stepType || 'custom',
      custom_type_name: customTypeName || undefined,
      estimated_time: estimatedTime || 30,
      xp_reward: xpReward || 1
    }

    const step = await createDailyStep(stepData)
    return NextResponse.json(step)
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
      const result = await sql`
        UPDATE daily_steps 
        SET 
          completed = ${completed},
          completed_at = ${completedAt ? new Date(completedAt) : null},
          updated_at = NOW()
        WHERE id = ${stepId}
        RETURNING *
      `
      
      if (result.length === 0) {
        console.log('PUT /api/daily-steps - Step not found for completion toggle')
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }
      
      console.log('PUT /api/daily-steps - Completion toggle successful:', result[0])
      return NextResponse.json(result[0])
    } else if (isDateOnly) {
      console.log('PUT /api/daily-steps - This is a date-only update (drag & drop)')
      console.log('PUT /api/daily-steps - Date value received:', date)
      // This is a date-only update (from drag & drop)
      // Use SQL DATE() function to ensure date-only storage
      if (date) {
        // Use CAST to ensure date-only storage without time component
        const result = await sql`
          UPDATE daily_steps 
          SET 
            date = CAST(${date}::text AS DATE),
            updated_at = NOW()
          WHERE id = ${stepId}
          RETURNING *
        `
        
        if (result.length === 0) {
          console.log('PUT /api/daily-steps - Step not found for date update')
          return NextResponse.json({ error: 'Step not found' }, { status: 404 })
        }
        
        console.log('PUT /api/daily-steps - Date update successful:', result[0])
        return NextResponse.json(result[0])
      } else {
        // Setting date to null
        const result = await sql`
          UPDATE daily_steps 
          SET 
            date = NULL,
            updated_at = NOW()
          WHERE id = ${stepId}
          RETURNING *
        `
        
        if (result.length === 0) {
          console.log('PUT /api/daily-steps - Step not found for date update')
          return NextResponse.json({ error: 'Step not found' }, { status: 404 })
        }
        
        console.log('PUT /api/daily-steps - Date cleared successfully:', result[0])
        return NextResponse.json(result[0])
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
          // Ensure date is in YYYY-MM-DD format
          let dateStr = date
          if (dateStr instanceof Date) {
            dateStr = dateStr.toISOString().split('T')[0]
          } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0]
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
      const query = `UPDATE daily_steps SET ${updateParts.join(', ')}, updated_at = NOW() WHERE id = $${updateValues.length + 1} RETURNING *`
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
      return NextResponse.json(result[0])
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
