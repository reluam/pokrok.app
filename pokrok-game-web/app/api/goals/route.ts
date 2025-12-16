import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyEntityOwnership, verifyOwnership } from '@/lib/auth-helpers'
import { createGoal, getGoalsByUserId, updateGoalById, deleteGoalById } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Použít dbUser.id místo userId z query parametru
    const targetUserId = userId || dbUser.id
    const goals = await getGoalsByUserId(targetUserId)
    return NextResponse.json(goals, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching goals:', error)
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
    const { userId, title, description, targetDate, status, priority, goalType, progressPercentage, progressType, icon, areaId } = body
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ✅ SECURITY: Ověření vlastnictví areaId, pokud je poskytnut
    if (areaId) {
      const areaOwned = await verifyEntityOwnership(areaId, 'areas', dbUser)
      if (!areaOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    // Použít dbUser.id místo userId z body
    const targetUserId = userId || dbUser.id

    const goalData = {
      user_id: targetUserId,
      title,
      description: description || undefined,
      target_date: targetDate ? new Date(targetDate) : undefined,
      status: status || 'active',
      priority: priority || 'meaningful',
      category: 'medium-term' as const, // Keep category for compatibility
      goal_type: goalType || 'outcome',
      progress_percentage: progressPercentage || 0,
      progress_type: progressType || 'percentage',
      icon: icon || 'Target',
      area_id: areaId || undefined
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
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { goalId, title, description, target_date, status, progressPercentage, icon, areaId } = body
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví goalu (efektivnější než načítat všechny goals)
    const goalOwned = await verifyEntityOwnership(goalId, 'goals', dbUser)
    if (!goalOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ✅ SECURITY: Ověření vlastnictví areaId, pokud je poskytnut
    if (areaId) {
      const areaOwned = await verifyEntityOwnership(areaId, 'areas', dbUser)
      if (!areaOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updates: any = {
      title,
      description,
      target_date: target_date ? new Date(target_date) : undefined,
      status,
      icon,
      area_id: areaId !== undefined ? areaId : undefined
    }

    if (progressPercentage !== undefined) {
      updates.progress_percentage = progressPercentage
    }

    const updatedGoal = await updateGoalById(goalId, updates)
    if (!updatedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedGoal)
  } catch (error: any) {
    console.error('Error updating goal:', error)
    const errorMessage = error?.message || 'Internal server error'
    const errorDetails = error?.details || error
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { goalId, deleteSteps } = body
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví goalu (efektivnější než načítat všechny goals)
    const goalOwned = await verifyEntityOwnership(goalId, 'goals', dbUser)
    if (!goalOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await deleteGoalById(goalId, deleteSteps === true)
    if (!success) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting goal:', error)
    const errorMessage = error?.message || 'Internal server error'
    const errorDetails = error?.details || error
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 })
  }
}

