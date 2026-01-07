import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

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
    if (filters.types?.includes('step')) {
      let steps
      if (filters.completed !== undefined) {
        steps = await sql`
          SELECT 
            id, 'step' as type, title, description, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            completed, goal_id, area_id
          FROM daily_steps
          WHERE user_id = ${targetUserId} 
          AND (title ILIKE ${searchPattern} OR description ILIKE ${searchPattern})
          AND completed = ${filters.completed}
          ${filters.goalId ? sql`AND goal_id = ${filters.goalId}` : sql``}
          ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
          ${filters.dateFrom ? sql`AND date >= ${filters.dateFrom}` : sql``}
          ${filters.dateTo ? sql`AND date <= ${filters.dateTo}` : sql``}
          ORDER BY date DESC, title ASC
          LIMIT 10
        `
      } else {
        steps = await sql`
          SELECT 
            id, 'step' as type, title, description, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            completed, goal_id, area_id
          FROM daily_steps
          WHERE user_id = ${targetUserId} 
          AND (title ILIKE ${searchPattern} OR description ILIKE ${searchPattern})
          ${filters.goalId ? sql`AND goal_id = ${filters.goalId}` : sql``}
          ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
          ${filters.dateFrom ? sql`AND date >= ${filters.dateFrom}` : sql``}
          ${filters.dateTo ? sql`AND date <= ${filters.dateTo}` : sql``}
          ORDER BY date DESC, title ASC
          LIMIT 10
        `
      }
      results.push(...steps.map((step: any) => ({
        id: step.id,
        type: 'step',
        title: step.title,
        description: step.description,
        metadata: {
          date: step.date,
          completed: step.completed,
          goal_id: step.goal_id,
          area_id: step.area_id
        }
      })))
    }

    // Search Goals
    if (filters.types?.includes('goal')) {
      const goals = await sql`
        SELECT id, 'goal' as type, title, description, status, target_date, area_id
        FROM goals
        WHERE user_id = ${targetUserId} 
        AND (title ILIKE ${searchPattern} OR description ILIKE ${searchPattern})
        ${filters.status && filters.status.length > 0 ? sql`AND status = ANY(${filters.status})` : sql``}
        ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
        ORDER BY created_at DESC, title ASC
        LIMIT 10
      `
      results.push(...goals.map((goal: any) => ({
        id: goal.id,
        type: 'goal',
        title: goal.title,
        description: goal.description,
        metadata: {
          status: goal.status,
          target_date: goal.target_date,
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
    if (filters.types?.includes('habit')) {
      const habits = await sql`
        SELECT id, 'habit' as type, name as title, description, frequency, category
        FROM habits
        WHERE user_id = ${targetUserId} 
        AND (name ILIKE ${searchPattern} OR description ILIKE ${searchPattern})
        ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
        ORDER BY created_at DESC, name ASC
        LIMIT 10
      `
      results.push(...habits.map((habit: any) => ({
        id: habit.id,
        type: 'habit',
        title: habit.title,
        description: habit.description,
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

