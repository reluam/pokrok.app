import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/cesta-db'
import { 
  getGoalMilestonesByGoalId, 
  getGoalMilestonesByGoalIds,
  createGoalMilestone, 
  updateGoalMilestone, 
  deleteGoalMilestone
} from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch goal milestones (supports single goalId or batch goalIds)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('goalId')
    const goalIdsParam = searchParams.get('goalIds')

    // Batch request - multiple goal IDs
    if (goalIdsParam) {
      try {
        const goalIds = JSON.parse(goalIdsParam) as string[]
        if (!Array.isArray(goalIds) || goalIds.length === 0) {
          return NextResponse.json({ error: 'goalIds must be a non-empty array' }, { status: 400 })
        }
        
        const milestonesByGoal = await getGoalMilestonesByGoalIds(goalIds)
        return NextResponse.json({ milestonesByGoal })
      } catch (parseError) {
        return NextResponse.json({ error: 'Invalid goalIds format. Expected JSON array.' }, { status: 400 })
      }
    }

    // Single goal request
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    const milestones = await getGoalMilestonesByGoalId(goalId)
    return NextResponse.json({ milestones })
  } catch (error) {
    console.error('Error fetching goal milestones:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create goal milestone
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { goalId, title, description, order } = await request.json()

    if (!goalId || !title) {
      return NextResponse.json({ error: 'Goal ID and title are required' }, { status: 400 })
    }

    const milestone = await createGoalMilestone({
      user_id: dbUser.id,
      goal_id: goalId,
      title,
      description,
      completed: false,
      order: order || 0
    })

    return NextResponse.json({ milestone })
  } catch (error) {
    console.error('Error creating goal milestone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update goal milestone
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { milestoneId, ...updates } = await request.json()

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 })
    }

    const milestone = await updateGoalMilestone(milestoneId, updates)

    return NextResponse.json({ milestone })
  } catch (error) {
    console.error('Error updating goal milestone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete goal milestone
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const milestoneId = searchParams.get('milestoneId')

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 })
    }

    await deleteGoalMilestone(milestoneId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal milestone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


