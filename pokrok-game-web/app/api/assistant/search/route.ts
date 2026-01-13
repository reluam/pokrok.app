import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { decryptFields, isEncrypted } from '@/lib/encryption'
import { getDailyStepsByUserId } from '@/lib/cesta-db'
import { getGoalsByUserId } from '@/lib/cesta-db'
import { getHabitsByUserId } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

interface SearchFilters {
  types?: ('step' | 'goal' | 'area' | 'habit')[]
  completed?: boolean
  status?: string[]
  dateFrom?: string
  dateTo?: string
  areaId?: string
  goalId?: string
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const userId = searchParams.get('userId')
    const filtersParam = searchParams.get('filters')

    // Verify user owns the userId
    if (userId && userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUserId = userId || dbUser.id

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    let filters: SearchFilters = {
      types: ['step', 'goal', 'area', 'habit']
    }

    if (filtersParam) {
      try {
        filters = { ...filters, ...JSON.parse(filtersParam) }
      } catch (error) {
        console.error('Error parsing filters:', error)
      }
    }

    const searchPattern = `%${query}%`
    const results: any[] = []

    // Search Steps
    // NOTE: Use getDailyStepsByUserId which already handles decryption correctly
    if (filters.types?.includes('step')) {
      // Calculate date range - get steps from last 365 days or use filters
      const today = new Date()
      const oneYearAgo = new Date(today)
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      
      const startDate = filters.dateFrom || oneYearAgo.toISOString().split('T')[0]
      const endDate = filters.dateTo || today.toISOString().split('T')[0]
      
      // Get all steps (already decrypted by getDailyStepsByUserId)
      const allSteps = await getDailyStepsByUserId(targetUserId, undefined, startDate, endDate)
      
      // Filter by additional criteria
      let filteredSteps = allSteps
      
      if (filters.completed !== undefined) {
        filteredSteps = filteredSteps.filter((step: any) => step.completed === filters.completed)
      }
      
      if (filters.goalId) {
        filteredSteps = filteredSteps.filter((step: any) => step.goal_id === filters.goalId)
      }
      
      if (filters.areaId) {
        filteredSteps = filteredSteps.filter((step: any) => step.area_id === filters.areaId)
      }
      
      // Search in decrypted data (steps are already decrypted by getDailyStepsByUserId)
      const queryLower = query.toLowerCase()
      const matchingSteps = filteredSteps
        .filter((step: any) => {
          const titleMatch = step.title?.toLowerCase().includes(queryLower) ?? false
          const descMatch = step.description?.toLowerCase().includes(queryLower) ?? false
          return titleMatch || descMatch
        })
        .slice(0, 10) // Limit to 10 results
      
      results.push(...matchingSteps.map((step: any) => ({
        id: step.id,
        type: 'step',
        title: step.title || '',
        description: step.description || null,
        metadata: {
          date: step.date ? (typeof step.date === 'string' ? step.date : step.date.toISOString().split('T')[0]) : null,
          completed: step.completed,
          goal_id: step.goal_id,
          area_id: step.area_id
        }
      })))
    }

    // Search Goals
    // NOTE: Use getGoalsByUserId which already handles decryption correctly
    if (filters.types?.includes('goal')) {
      // Get all goals (already decrypted by getGoalsByUserId)
      const allGoals = await getGoalsByUserId(targetUserId)
      
      // Filter by additional criteria
      let filteredGoals = allGoals
      
      if (filters.status && filters.status.length > 0) {
        filteredGoals = filteredGoals.filter((goal: any) => filters.status?.includes(goal.status))
      }
      
      if (filters.areaId) {
        filteredGoals = filteredGoals.filter((goal: any) => goal.area_id === filters.areaId)
      }
      
      // Search in decrypted data (goals are already decrypted by getGoalsByUserId)
      const queryLower = query.toLowerCase()
      const matchingGoals = filteredGoals
        .filter((goal: any) => {
          const titleMatch = goal.title?.toLowerCase().includes(queryLower) ?? false
          const descMatch = goal.description?.toLowerCase().includes(queryLower) ?? false
          return titleMatch || descMatch
        })
        .slice(0, 10) // Limit to 10 results
      
      results.push(...matchingGoals.map((goal: any) => ({
        id: goal.id,
        type: 'goal',
        title: goal.title || '',
        description: goal.description || null,
        metadata: {
          status: goal.status,
          target_date: goal.target_date ? (typeof goal.target_date === 'string' ? goal.target_date : goal.target_date.toISOString().split('T')[0]) : null,
          area_id: goal.area_id
        }
      })))
    }

    // Search Areas
    if (filters.types?.includes('area')) {
      const areas = await sql`
        SELECT id, 'area' as type, name as title, description, color, icon
        FROM areas
        WHERE user_id = ${targetUserId} 
        AND (name ILIKE ${searchPattern} OR description ILIKE ${searchPattern})
        ORDER BY name ASC
        LIMIT 10
      `
      results.push(...areas.map((area: any) => ({
        id: area.id,
        type: 'area',
        title: area.title,
        description: area.description,
        metadata: {
          color: area.color,
          icon: area.icon
        }
      })))
    }

    // Search Habits
    // NOTE: Use getHabitsByUserId which already handles decryption correctly
    if (filters.types?.includes('habit')) {
      // Get all habits (already decrypted by getHabitsByUserId)
      const allHabits = await getHabitsByUserId(targetUserId)
      
      // Filter by additional criteria
      let filteredHabits = allHabits
      
      if (filters.areaId) {
        filteredHabits = filteredHabits.filter((habit: any) => habit.area_id === filters.areaId)
      }
      
      // Search in decrypted data (habits are already decrypted by getHabitsByUserId)
      const queryLower = query.toLowerCase()
      const matchingHabits = filteredHabits
        .filter((habit: any) => {
          const nameMatch = habit.name?.toLowerCase().includes(queryLower) ?? false
          const descMatch = habit.description?.toLowerCase().includes(queryLower) ?? false
          return nameMatch || descMatch
        })
        .slice(0, 10) // Limit to 10 results
      
      results.push(...matchingHabits.map((habit: any) => ({
        id: habit.id,
        type: 'habit',
        title: habit.name || '',
        description: habit.description || null,
        metadata: {
          frequency: habit.frequency,
          category: habit.category
        }
      })))
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in search:', error)
    return NextResponse.json(
      { error: 'Internal server error', results: [] },
      { status: 500 }
    )
  }
}

