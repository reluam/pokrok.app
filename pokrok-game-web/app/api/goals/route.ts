import { NextRequest, NextResponse } from 'next/server'
import { createGoal, getGoalsByUserId, updateGoalById, deleteGoalById } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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
    const body = await request.json()
    const { userId, title, description, targetDate, status, priority, areaId, goalType, progressPercentage, progressType } = body
    
    if (!userId || !title) {
      return NextResponse.json({ error: 'User ID and title are required' }, { status: 400 })
    }

    const goalData = {
      user_id: userId,
      title,
      description: description || undefined,
      target_date: targetDate ? new Date(targetDate) : undefined,
      status: status || 'active',
      priority: priority || 'meaningful',
      category: 'medium-term' as const, // Keep category for compatibility
      area_id: areaId || null,
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
    const body = await request.json()
    const { goalId, title, description, target_date, status, areaId, progressPercentage } = body
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    const updates: any = {
      title,
      description,
      target_date: target_date ? new Date(target_date) : undefined,
      status,
      area_id: areaId
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
    const body = await request.json()
    const { goalId } = body
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
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
