import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { decryptFields, isEncrypted } from '@/lib/encryption'

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
    // NOTE: Steps are encrypted, so we need to load all steps, decrypt them, then search in memory
    if (filters.types?.includes('step')) {
      let allSteps
      if (filters.completed !== undefined) {
        allSteps = await sql`
          SELECT 
            id, title, description, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            completed, goal_id, area_id
          FROM daily_steps
          WHERE user_id = ${targetUserId} 
          AND completed = ${filters.completed}
          ${filters.goalId ? sql`AND goal_id = ${filters.goalId}` : sql``}
          ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
          ${filters.dateFrom ? sql`AND date >= ${filters.dateFrom}` : sql``}
          ${filters.dateTo ? sql`AND date <= ${filters.dateTo}` : sql``}
          ORDER BY date DESC
          LIMIT 100
        `
      } else {
        allSteps = await sql`
          SELECT 
            id, title, description, 
            TO_CHAR(date, 'YYYY-MM-DD') as date,
            completed, goal_id, area_id
          FROM daily_steps
          WHERE user_id = ${targetUserId} 
          ${filters.goalId ? sql`AND goal_id = ${filters.goalId}` : sql``}
          ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
          ${filters.dateFrom ? sql`AND date >= ${filters.dateFrom}` : sql``}
          ${filters.dateTo ? sql`AND date <= ${filters.dateTo}` : sql``}
          ORDER BY date DESC
          LIMIT 100
        `
      }
      
      // Decrypt steps and search in memory
      const decryptedSteps = allSteps.map((step: any) => {
        const decrypted = decryptFields(step, targetUserId, ['title', 'description'])
        // Double-check: if still encrypted, try again or skip
        let title = decrypted.title || ''
        let description = decrypted.description || null
        
        // If title is still encrypted (contains :), try to decrypt again
        if (title && isEncrypted(title)) {
          console.warn('Step title still encrypted after decryptFields, skipping:', step.id)
          title = '' // Skip this step from results
        }
        if (description && isEncrypted(description)) {
          description = null
        }
        
        return {
          ...decrypted,
          title,
          description
        }
      }).filter((step: any) => step.title && step.title.length > 0) // Filter out steps with empty titles
      
      // Search in decrypted data
      const queryLower = query.toLowerCase()
      const matchingSteps = decryptedSteps
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
          date: step.date,
          completed: step.completed,
          goal_id: step.goal_id,
          area_id: step.area_id
        }
      })))
    }

    // Search Goals
    // NOTE: Goals are encrypted, so we need to load all goals, decrypt them, then search in memory
    if (filters.types?.includes('goal')) {
      const allGoals = await sql`
        SELECT id, title, description, status, target_date, area_id
        FROM goals
        WHERE user_id = ${targetUserId} 
        ${filters.status && filters.status.length > 0 ? sql`AND status = ANY(${filters.status})` : sql``}
        ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
        ORDER BY created_at DESC
        LIMIT 100
      `
      
      // Decrypt goals and search in memory
      const decryptedGoals = allGoals.map((goal: any) => {
        const decrypted = decryptFields(goal, targetUserId, ['title', 'description'])
        // Double-check: if still encrypted, try again or skip
        let title = decrypted.title || ''
        let description = decrypted.description || null
        
        // If title is still encrypted (contains :), try to decrypt again
        if (title && isEncrypted(title)) {
          console.warn('Goal title still encrypted after decryptFields, skipping:', goal.id)
          title = '' // Skip this goal from results
        }
        if (description && isEncrypted(description)) {
          description = null
        }
        
        return {
          ...decrypted,
          title,
          description
        }
      }).filter((goal: any) => goal.title && goal.title.length > 0) // Filter out goals with empty titles
      
      // Search in decrypted data
      const queryLower = query.toLowerCase()
      const matchingGoals = decryptedGoals
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
    // NOTE: Habits are encrypted, so we need to load all habits, decrypt them, then search in memory
    if (filters.types?.includes('habit')) {
      const allHabits = await sql`
        SELECT id, name, description, frequency, category
        FROM habits
        WHERE user_id = ${targetUserId} 
        ${filters.areaId ? sql`AND area_id = ${filters.areaId}` : sql``}
        ORDER BY created_at DESC
        LIMIT 100
      `
      
      // Decrypt habits and search in memory
      const decryptedHabits = allHabits.map((habit: any) => {
        const decrypted = decryptFields(habit, targetUserId, ['name', 'description'])
        // Double-check: if still encrypted, try again or skip
        let name = decrypted.name || ''
        let description = decrypted.description || null
        
        // If name is still encrypted (contains :), try to decrypt again
        if (name && isEncrypted(name)) {
          console.warn('Habit name still encrypted after decryptFields, skipping:', habit.id)
          name = '' // Skip this habit from results
        }
        if (description && isEncrypted(description)) {
          description = null
        }
        
        return {
          ...decrypted,
          name,
          description
        }
      }).filter((habit: any) => habit.name && habit.name.length > 0) // Filter out habits with empty names
      
      // Search in decrypted data
      const queryLower = query.toLowerCase()
      const matchingHabits = decryptedHabits
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

