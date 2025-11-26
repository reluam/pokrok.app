import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, getGoalsByUserId, updateGoalById } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || '')

// POST /api/goals/focus - Set focus status for a goal
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goalId, focusStatus, focusOrder } = body
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    // Verify that the goal belongs to the authenticated user
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the goal to verify ownership
    const goals = await getGoalsByUserId(dbUser.id)
    const goal = goals.find(g => g.id === goalId)
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    // If setting to active_focus, we need to handle focus_order
    if (focusStatus === 'active_focus') {
      // If focusOrder is not provided, add to the end
      let newOrder = focusOrder
      
      if (newOrder === undefined || newOrder === null) {
        // Get current active focus goals to determine new order
        const activeFocusGoals = goals.filter(g => 
          g.focus_status === 'active_focus' && g.id !== goalId
        )
        newOrder = activeFocusGoals.length + 1
      } else {
        // Reorder existing goals - shift goals with order >= newOrder
        const goalsToShift = goals.filter(g => 
          g.focus_status === 'active_focus' && 
          g.id !== goalId && 
          g.focus_order !== null && 
          g.focus_order! >= newOrder!
        )
        
        // Update shifted goals
        for (const g of goalsToShift) {
          await updateGoalById(g.id, { focus_order: (g.focus_order || 0) + 1 })
        }
      }

      // Update the goal
      const updatedGoal = await updateGoalById(goalId, {
        focus_status: 'active_focus',
        focus_order: newOrder
      })

      if (!updatedGoal) {
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
      }

      return NextResponse.json({ success: true, goal: updatedGoal })
    } else {
      // For deferred or null, set focus_order to null
      const updatedGoal = await updateGoalById(goalId, {
        focus_status: focusStatus || null,
        focus_order: null
      })

      if (!updatedGoal) {
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
      }

      // If removing from active focus, reorder remaining active goals
      if (goal.focus_status === 'active_focus' && focusStatus !== 'active_focus') {
        const remainingActiveGoals = goals.filter(g => 
          g.focus_status === 'active_focus' && 
          g.id !== goalId &&
          g.focus_order !== null &&
          g.focus_order! > (goal.focus_order || 0)
        )

        // Shift remaining goals down
        for (const g of remainingActiveGoals) {
          await updateGoalById(g.id, { focus_order: (g.focus_order || 0) - 1 })
        }
      }

      return NextResponse.json({ success: true, goal: updatedGoal })
    }
  } catch (error) {
    console.error('Error updating goal focus:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/goals/focus/reorder - Reorder goals in active focus
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goalIds } = body
    
    if (!goalIds || !Array.isArray(goalIds)) {
      return NextResponse.json({ error: 'Goal IDs array is required' }, { status: 400 })
    }

    // Verify that all goals belong to the authenticated user
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const goals = await getGoalsByUserId(dbUser.id)
    const userGoalIds = new Set(goals.map(g => g.id))
    
    // Verify all goalIds belong to user
    for (const goalId of goalIds) {
      if (!userGoalIds.has(goalId)) {
        return NextResponse.json({ 
          error: `Goal ${goalId} not found or access denied` 
        }, { status: 403 })
      }
    }

    // Update focus_order for each goal
    const updatedGoals = []
    for (let i = 0; i < goalIds.length; i++) {
      const goalId = goalIds[i]
      const newOrder = i + 1
      
      const updatedGoal = await updateGoalById(goalId, {
        focus_order: newOrder,
        focus_status: 'active_focus' // Ensure they're in active focus
      })

      if (updatedGoal) {
        updatedGoals.push(updatedGoal)
      }
    }

    return NextResponse.json({ success: true, goals: updatedGoals })
  } catch (error) {
    console.error('Error reordering goals:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/goals/focus - Get goals by focus status
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const focusStatus = searchParams.get('focusStatus') as 'active_focus' | 'deferred' | null

    // Verify user
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all goals
    const allGoals = await getGoalsByUserId(dbUser.id)

    // Filter by focus status if provided
    let filteredGoals = allGoals
    if (focusStatus !== null) {
      filteredGoals = allGoals.filter(g => g.focus_status === focusStatus)
    }

    // Sort active_focus goals by focus_order
    if (focusStatus === 'active_focus') {
      filteredGoals.sort((a, b) => {
        const orderA = a.focus_order ?? 999
        const orderB = b.focus_order ?? 999
        return orderA - orderB
      })
    }

    return NextResponse.json({ goals: filteredGoals })
  } catch (error) {
    console.error('Error fetching goals by focus:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

