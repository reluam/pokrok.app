import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createGoal, getGoalsByUserId, updateGoalById, deleteGoalById, getUserByClerkId } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify that the userId belongs to the authenticated user
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser || dbUser.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const goals = await getGoalsByUserId(userId)
    return NextResponse.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, title, description, targetDate, status, priority, goalType, progressPercentage, progressType } = body
    
    if (!userId || !title) {
      return NextResponse.json({ error: 'User ID and title are required' }, { status: 400 })
    }

    // Verify that the userId belongs to the authenticated user
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser || dbUser.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const goalData = {
      user_id: userId,
      title,
      description: description || undefined,
      target_date: targetDate ? new Date(targetDate) : undefined,
      status: status || 'active',
      priority: priority || 'meaningful',
      category: 'medium-term' as const, // Keep category for compatibility
      goal_type: goalType || 'outcome',
      progress_percentage: progressPercentage || 0,
      progress_type: progressType || 'percentage'
    }

    const goal = await createGoal(goalData)
    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goalId, title, description, target_date, status, progressPercentage } = body
    
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

    const updates: any = {
      title,
      description,
      target_date: target_date ? new Date(target_date) : undefined,
      status
    }

    if (progressPercentage !== undefined) {
      updates.progress_percentage = progressPercentage
    }

    const updatedGoal = await updateGoalById(goalId, updates)
    if (!updatedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goalId } = body
    
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

    const success = await deleteGoalById(goalId)
    if (!success) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
