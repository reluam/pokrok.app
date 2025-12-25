import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { 
  getGoalMetricsByGoalId, 
  createGoalMetric, 
  updateGoalMetric, 
  deleteGoalMetric,
  updateGoalProgressFromGoalMetrics,
  updateGoalProgressCombined,
  getGoalById,
  getUserByClerkId
} from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || '')

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch goal metrics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('goalId')

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    const metrics = await getGoalMetricsByGoalId(goalId)
    
    // Recalculate goal progress when loading metrics
    try {
      const goal = await getGoalById(goalId)
      if (goal) {
        if (goal.progress_calculation_type === 'metrics') {
          await updateGoalProgressFromGoalMetrics(goalId)
        } else {
          await updateGoalProgressCombined(goalId)
        }
      }
    } catch (progressError: any) {
      console.error('GET /api/goal-metrics - Error updating goal progress:', progressError)
      // Don't fail the request if progress update fails
    }
    
    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Error fetching goal metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create goal metric
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get database user ID from Clerk user ID
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { goalId, name, description, type, unit, targetValue, currentValue, initialValue, incrementalValue } = await request.json()

    console.log('POST /api/goal-metrics - Request data:', { goalId, name, description, type, unit, targetValue, currentValue, initialValue, incrementalValue })

    if (!goalId || !name || !type || !unit || targetValue === undefined) {
      console.error('POST /api/goal-metrics - Missing required fields:', { goalId, name, type, unit, targetValue })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure goal_metrics table exists with correct structure
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'goal_metrics'
        )
      `
      
      if (!tableCheck[0]?.exists) {
        console.log('POST /api/goal-metrics - Creating goal_metrics table...')
        await sql`
          CREATE TABLE goal_metrics (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'currency', 'percentage', 'distance', 'time', 'weight', 'custom')),
            unit VARCHAR(50) NOT NULL,
            target_value DECIMAL(10,2) NOT NULL,
            current_value DECIMAL(10,2) DEFAULT 0,
            incremental_value DECIMAL(10,2) DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
        console.log('POST /api/goal-metrics - goal_metrics table created successfully')
      } else {
        // Table exists, check if it has the correct structure
        const allColumns = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'goal_metrics'
        `
        const existingColumns = allColumns.map((row: any) => row.column_name)
        console.log('POST /api/goal-metrics - Existing columns:', existingColumns)
        
        const requiredColumns = ['id', 'user_id', 'goal_id', 'name', 'description', 'type', 'unit', 'target_value', 'current_value', 'initial_value', 'incremental_value', 'created_at', 'updated_at']
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
        
        // Check if initial_value column exists
        if (!existingColumns.includes('initial_value')) {
          try {
            console.log('POST /api/goal-metrics - Adding initial_value column...')
            await sql`ALTER TABLE goal_metrics ADD COLUMN initial_value DECIMAL(10,2) DEFAULT 0`
            console.log('POST /api/goal-metrics - initial_value column added successfully')
          } catch (e: any) {
            console.warn('POST /api/goal-metrics - Could not add initial_value column:', e?.message)
          }
        }
        
        // Update type constraint to include 'weight'
        try {
          console.log('POST /api/goal-metrics - Updating type constraint to include weight...')
          await sql`ALTER TABLE goal_metrics DROP CONSTRAINT IF EXISTS goal_metrics_type_check`
          await sql`ALTER TABLE goal_metrics ADD CONSTRAINT goal_metrics_type_check CHECK (type IN ('number', 'currency', 'percentage', 'distance', 'time', 'weight', 'custom'))`
          console.log('POST /api/goal-metrics - Type constraint updated successfully')
        } catch (e: any) {
          console.warn('POST /api/goal-metrics - Could not update type constraint:', e?.message)
        }
        
        if (missingColumns.length > 0 && missingColumns.filter(col => col !== 'initial_value').length > 0) {
          console.log('POST /api/goal-metrics - Missing columns detected:', missingColumns)
          console.log('POST /api/goal-metrics - Recreating table with correct structure...')
          // Drop and recreate table with correct structure
          await sql`DROP TABLE IF EXISTS goal_metrics CASCADE`
          await sql`
            CREATE TABLE goal_metrics (
              id VARCHAR(255) PRIMARY KEY,
              user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'currency', 'percentage', 'distance', 'time', 'weight', 'custom')),
              unit VARCHAR(50) NOT NULL,
              target_value DECIMAL(10,2) NOT NULL,
              current_value DECIMAL(10,2) DEFAULT 0,
              initial_value DECIMAL(10,2) DEFAULT 0,
              incremental_value DECIMAL(10,2) DEFAULT 1,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          `
          console.log('POST /api/goal-metrics - goal_metrics table recreated successfully')
        } else {
          console.log('POST /api/goal-metrics - Table structure is correct')
        }
      }
    } catch (migrationError: any) {
      console.error('POST /api/goal-metrics - Error ensuring goal_metrics table structure:', migrationError)
      console.error('Migration error details:', {
        message: migrationError?.message,
        code: migrationError?.code,
        detail: migrationError?.detail
      })
      // Continue anyway, createGoalMetric will try to handle it
    }

    const metric = await createGoalMetric({
      user_id: dbUser.id,
      goal_id: goalId,
      name,
      description,
      type,
      unit,
      target_value: targetValue,
      current_value: currentValue || 0,
      initial_value: initialValue ?? 0,
      incremental_value: incrementalValue || 1
    })
    
    console.log('POST /api/goal-metrics - Metric created:', metric)

    // Update goal progress based on calculation type
    let updatedGoal = null
    try {
      const goal = await getGoalById(goalId)
      
      if (goal?.progress_calculation_type === 'metrics') {
        await updateGoalProgressFromGoalMetrics(goalId)
      } else {
        await updateGoalProgressCombined(goalId)
      }
      // Get updated goal with new progress
      updatedGoal = await getGoalById(goalId)
    } catch (progressError: any) {
      console.error('POST /api/goal-metrics - Error updating goal progress:', progressError)
      // Don't fail the request if progress update fails
      // Try to get goal anyway
      try {
        updatedGoal = await getGoalById(goalId)
      } catch (e) {
        // Ignore
      }
    }

    return NextResponse.json({ metric, goal: updatedGoal })
  } catch (error: any) {
    console.error('Error creating goal metric:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint
    })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error',
      code: error?.code,
      hint: error?.hint
    }, { status: 500 })
  }
}

// PUT - Update goal metric
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { metricId, goalId, name, description, type, unit, targetValue, currentValue, initialValue, incrementalValue } = await request.json()

    if (!metricId) {
      return NextResponse.json({ error: 'Metric ID is required' }, { status: 400 })
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (type !== undefined) updates.type = type
    if (unit !== undefined) updates.unit = unit
    if (targetValue !== undefined) updates.target_value = targetValue
    if (currentValue !== undefined) {
      // Ensure currentValue is a number
      updates.current_value = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue) || 0
    }
    if (initialValue !== undefined) {
      // Ensure initialValue is a number
      updates.initial_value = typeof initialValue === 'number' ? initialValue : parseFloat(initialValue) || 0
    }
    if (incrementalValue !== undefined) updates.incremental_value = incrementalValue

    const metric = await updateGoalMetric(metricId, updates)

    // Update goal progress if goalId is provided
    let updatedGoal = null
    if (goalId) {
      try {
        const goal = await getGoalById(goalId)
        
        if (goal?.progress_calculation_type === 'metrics') {
          await updateGoalProgressFromGoalMetrics(goalId)
        } else {
          await updateGoalProgressCombined(goalId)
        }
        // Get updated goal with new progress
        updatedGoal = await getGoalById(goalId)
      } catch (progressError: any) {
        console.error('PUT /api/goal-metrics - Error updating goal progress:', progressError)
        // Don't fail the request if progress update fails
      }
    }

    return NextResponse.json({ metric, goal: updatedGoal })
  } catch (error) {
    console.error('Error updating goal metric:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete goal metric
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const metricId = searchParams.get('metricId')
    const goalId = searchParams.get('goalId')

    if (!metricId) {
      return NextResponse.json({ error: 'Metric ID is required' }, { status: 400 })
    }

    await deleteGoalMetric(metricId)

    // Update goal progress if goalId is provided
    let updatedGoal = null
    if (goalId) {
      try {
        const goal = await getGoalById(goalId)
        
        if (goal?.progress_calculation_type === 'metrics') {
          await updateGoalProgressFromGoalMetrics(goalId)
        } else {
          await updateGoalProgressCombined(goalId)
        }
        // Get updated goal with new progress
        updatedGoal = await getGoalById(goalId)
      } catch (progressError: any) {
        console.error('DELETE /api/goal-metrics - Error updating goal progress:', progressError)
        // Don't fail the request if progress update fails
        // Try to get goal anyway
        try {
          updatedGoal = await getGoalById(goalId)
        } catch (e) {
          // Ignore
        }
      }
    }

    return NextResponse.json({ success: true, goal: updatedGoal })
  } catch (error) {
    console.error('Error deleting goal metric:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Increment metric value
export async function PATCH(request: NextRequest) {
  console.log('PATCH /api/goal-metrics - Endpoint called')
  try {
    console.log('PATCH /api/goal-metrics - Authenticating...')
    const { userId } = await auth()
    console.log('PATCH /api/goal-metrics - User ID:', userId)
    if (!userId) {
      console.log('PATCH /api/goal-metrics - Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { metricId, goalId } = await request.json()
    console.log('PATCH /api/goal-metrics - Request data:', { metricId, goalId })

    if (!metricId || !goalId) {
      return NextResponse.json({ error: 'Metric ID and Goal ID are required' }, { status: 400 })
    }

    // Get current metric
    console.log('PATCH /api/goal-metrics - Fetching metrics for goal:', goalId)
    const metrics = await getGoalMetricsByGoalId(goalId)
    console.log('PATCH /api/goal-metrics - Found metrics:', metrics.length)
    const metric = metrics.find(m => m.id === metricId)
    
    if (!metric) {
      console.error('PATCH /api/goal-metrics - Metric not found:', metricId)
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 })
    }

    console.log('PATCH /api/goal-metrics - Current metric:', {
      id: metric.id,
      current_value: metric.current_value,
      incremental_value: metric.incremental_value
    })

    // Increment or decrement by incremental_value
    // If target_value > 0 and current_value >= target_value, decrement instead of increment
    // If target_value is 0, always increment
    // Ensure values are numbers, not strings
    const currentValue = typeof metric.current_value === 'number' 
      ? metric.current_value 
      : parseFloat(metric.current_value) || 0
    const targetValue = typeof metric.target_value === 'number'
      ? metric.target_value
      : parseFloat(metric.target_value) || 0
    const incrementalValue = typeof metric.incremental_value === 'number'
      ? metric.incremental_value
      : parseFloat(metric.incremental_value) || 1
    
    // If target value is set (> 0) and current value is greater than or equal to target, decrement
    // Otherwise, increment (including when target is 0)
    const newValue = (targetValue > 0 && currentValue >= targetValue)
      ? Math.max(0, currentValue - incrementalValue) // Don't go below 0
      : currentValue + incrementalValue
    console.log('PATCH /api/goal-metrics - New value:', newValue, 'from', currentValue, (targetValue > 0 && currentValue >= targetValue) ? '-' : '+', incrementalValue)
    
    console.log('PATCH /api/goal-metrics - Updating metric...')
    const updatedMetric = await updateGoalMetric(metricId, { current_value: newValue })
    console.log('PATCH /api/goal-metrics - Metric updated:', updatedMetric)

    // Update goal progress
    try {
      console.log('PATCH /api/goal-metrics - Fetching goal:', goalId)
      const goal = await getGoalById(goalId)
      console.log('PATCH /api/goal-metrics - Goal found:', goal ? 'yes' : 'no')
      
      if (goal) {
        console.log('PATCH /api/goal-metrics - Goal progress_calculation_type:', goal.progress_calculation_type)
        // Check if progress_calculation_type column exists, if not use default behavior
        if (goal.progress_calculation_type === 'metrics') {
          console.log('PATCH /api/goal-metrics - Updating progress from metrics only')
          await updateGoalProgressFromGoalMetrics(goalId)
        } else {
          console.log('PATCH /api/goal-metrics - Updating progress combined')
          await updateGoalProgressCombined(goalId)
        }
        console.log('PATCH /api/goal-metrics - Goal progress updated successfully')
        // Get updated goal with new progress
        const updatedGoal = await getGoalById(goalId)
        return NextResponse.json({ metric: updatedMetric, goal: updatedGoal })
      }
    } catch (progressError: any) {
      // If progress update fails, log but don't fail the request
      console.error('PATCH /api/goal-metrics - Error updating goal progress:', progressError)
      console.error('Progress error details:', {
        message: progressError?.message,
        code: progressError?.code,
        detail: progressError?.detail,
        stack: progressError?.stack
      })
      // Try to update with combined formula as fallback
      try {
        console.log('PATCH /api/goal-metrics - Trying fallback progress update...')
        await updateGoalProgressCombined(goalId)
        console.log('PATCH /api/goal-metrics - Fallback progress update succeeded')
      } catch (fallbackError: any) {
        console.error('PATCH /api/goal-metrics - Fallback progress update also failed:', fallbackError)
        console.error('Fallback error details:', {
          message: fallbackError?.message,
          code: fallbackError?.code,
          detail: fallbackError?.detail
        })
      }
    }

    // Get updated goal even if progress update failed
    let updatedGoal = null
    try {
      updatedGoal = await getGoalById(goalId)
    } catch (error) {
      console.error('PATCH /api/goal-metrics - Error fetching updated goal:', error)
    }

    console.log('PATCH /api/goal-metrics - Returning updated metric')
    return NextResponse.json({ metric: updatedMetric, goal: updatedGoal })
  } catch (error: any) {
    console.error('PATCH /api/goal-metrics - Error incrementing goal metric:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      stack: error?.stack
    })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error',
      code: error?.code
    }, { status: 500 })
  }
}

