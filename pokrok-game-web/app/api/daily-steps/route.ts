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
    
    // Check if this is a completion toggle or full update
    if (completed !== undefined && title === undefined) {
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
    } else {
      console.log('PUT /api/daily-steps - This is a full update (edit form)')
      // This is a full update (edit form)
      const result = await sql`
        UPDATE daily_steps 
        SET 
          title = ${title || null},
          description = ${description || null},
          goal_id = ${goalId || null},
          is_important = ${isImportant || false},
          is_urgent = ${isUrgent || false},
          estimated_time = ${estimatedTime || 30},
          xp_reward = ${xpReward || 1},
          date = ${date ? new Date(date) : new Date()},
          updated_at = NOW()
        WHERE id = ${stepId}
        RETURNING *
      `

      if (result.length === 0) {
        console.log('PUT /api/daily-steps - Step not found for full update')
        return NextResponse.json({ error: 'Step not found' }, { status: 404 })
      }

      console.log('PUT /api/daily-steps - Full update successful:', result[0])
      return NextResponse.json(result[0])
    }
  } catch (error) {
    console.error('PUT /api/daily-steps - Error updating daily step:', error)
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
