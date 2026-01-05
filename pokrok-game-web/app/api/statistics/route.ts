import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // 'week', 'month', 'year', 'all'
    const previousPeriod = searchParams.get('previousPeriod') === 'true' // If true, return previous period data
    const userId = dbUser.id

    // Calculate date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let startDate: Date
    let endDate: Date = new Date(today)
    
    if (previousPeriod) {
      // Calculate previous period dates
      switch (period) {
        case 'week':
          endDate = new Date(today)
          endDate.setDate(endDate.getDate() - 7)
          startDate = new Date(endDate)
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          endDate = new Date(today)
          endDate.setMonth(endDate.getMonth() - 1)
          endDate.setDate(1) // First day of previous month
          startDate = new Date(endDate)
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          endDate = new Date(today)
          endDate.setFullYear(endDate.getFullYear() - 1)
          endDate.setMonth(0, 1) // January 1st of previous year
          startDate = new Date(endDate)
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default: // 'all' - previous period doesn't make sense
          endDate = new Date(today)
          startDate = new Date(today)
          startDate.setFullYear(startDate.getFullYear() - 10)
          break
      }
    } else {
      // Current period
      switch (period) {
        case 'week':
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate = new Date(today)
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate = new Date(today)
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default: // 'all'
          // Get user creation date
          const userResult = await sql`
            SELECT created_at FROM users WHERE id = ${userId}
          `
          startDate = userResult[0]?.created_at ? new Date(userResult[0].created_at) : new Date(today)
          startDate.setFullYear(startDate.getFullYear() - 10) // Fallback to 10 years ago
          break
      }
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Get steps statistics
    const stepsResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed = true) as completed,
        COUNT(*) as planned_in_period
      FROM daily_steps
      WHERE user_id = ${userId}
      AND date >= ${startDateStr}::date
      AND date <= ${endDateStr}::date
    `

    // Get habits statistics - count total habits and completions in period
    const habitsTotalResult = await sql`
      SELECT COUNT(DISTINCT h.id) as total
      FROM habits h
      WHERE h.user_id = ${userId}
    `
    
    // Count all habit completions in the period (not unique habits)
    const habitsCompletedResult = await sql`
      SELECT COUNT(*) as completed
      FROM habit_completions hc
      WHERE hc.user_id = ${userId}
        AND hc.completion_date >= ${startDateStr}::date
        AND hc.completion_date <= ${endDateStr}::date
    `

    // Get goals statistics
    const goalsResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed' AND updated_at >= ${startDateStr}::date AND updated_at <= ${endDateStr}::date) as completed
      FROM goals
      WHERE user_id = ${userId}
      AND (created_at >= ${startDateStr}::date OR updated_at >= ${startDateStr}::date)
    `

    // Get daily completion data for charts
    const dailyCompletions = await sql`
      SELECT 
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        COUNT(*) FILTER (WHERE completed = true) as completed_steps,
        COUNT(*) as total_steps
      FROM daily_steps
      WHERE user_id = ${userId}
      AND date >= ${startDateStr}::date
      AND date <= ${endDateStr}::date
      GROUP BY date
      ORDER BY date
    `

    // Get habit completions by date
    const habitCompletions = await sql`
      SELECT 
        TO_CHAR(completion_date, 'YYYY-MM-DD') as date,
        COUNT(*) as completed_habits
      FROM habit_completions
      WHERE user_id = ${userId}
      AND completion_date >= ${startDateStr}::date
      AND completion_date <= ${endDateStr}::date
      GROUP BY completion_date
      ORDER BY completion_date
    `

    // Get all habits for the user to calculate planned habits per day
    const allHabits = await sql`
      SELECT 
        id,
        frequency,
        selected_days,
        start_date,
        created_at
      FROM habits
      WHERE user_id = ${userId}
    `

    const steps = stepsResult[0] || { total: 0, completed: 0, planned_in_period: 0 }
    const habits = {
      total: parseInt(habitsTotalResult[0]?.total || '0'),
      completed: parseInt(habitsCompletedResult[0]?.completed || '0')
    }
    const goals = goalsResult[0] || { total: 0, completed: 0 }

    // Helper function to check if habit is scheduled for a day
    const isHabitScheduledForDay = (habit: any, day: Date): boolean => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[day.getDay()]
      const dayOfMonth = day.getDate()
      
      // Check if habit has started
      if (habit.start_date) {
        const startDate = new Date(habit.start_date)
        startDate.setHours(0, 0, 0, 0)
        if (day < startDate) return false
      } else if (habit.created_at) {
        const createdDate = new Date(habit.created_at)
        createdDate.setHours(0, 0, 0, 0)
        if (day < createdDate) return false
      }
      
      // Daily frequency
      if (habit.frequency === 'daily') return true
      
      // Weekly or custom frequency - check if day of week is in selected_days
      if (habit.frequency === 'weekly' || habit.frequency === 'custom') {
        if (habit.selected_days) {
          let selectedDays = habit.selected_days
          if (typeof selectedDays === 'string') {
            try {
              selectedDays = JSON.parse(selectedDays)
            } catch {
              selectedDays = selectedDays.split(',').map((s: string) => s.trim())
            }
          }
          if (Array.isArray(selectedDays)) {
            return selectedDays.some((d: string) => d.toLowerCase() === dayName)
          }
        }
        return false
      }
      
      // Monthly frequency
      if (habit.frequency === 'monthly') {
        if (habit.selected_days) {
          let selectedDays = habit.selected_days
          if (typeof selectedDays === 'string') {
            try {
              selectedDays = JSON.parse(selectedDays)
            } catch {
              selectedDays = selectedDays.split(',').map((s: string) => s.trim())
            }
          }
          if (Array.isArray(selectedDays)) {
            // Check for day of month (1-31)
            if (selectedDays.includes(dayOfMonth.toString())) return true
            
            // Check for day of week in month (e.g., "first_monday")
            for (const selectedDay of selectedDays) {
              if (typeof selectedDay === 'string' && selectedDay.includes('_')) {
                const [week, dayOfWeek] = selectedDay.split('_')
                if (dayNames.includes(dayOfWeek) && dayName === dayOfWeek) {
                  // Simple check - if it's the right day of week, count it
                  // (full implementation would check first/second/third/fourth/last)
                  return true
                }
              }
            }
          }
        }
        return false
      }
      
      return false
    }

    // Generate all dates in the range
    const allDates: string[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Combine daily data
    const dailyDataMap = new Map()
    
    // Initialize all dates
    allDates.forEach((dateStr) => {
      dailyDataMap.set(dateStr, {
        date: dateStr,
        completed_steps: 0,
        total_steps: 0,
        completed_habits: 0,
        total_habits: 0
      })
    })
    
    // Add step data
    dailyCompletions.forEach((row: any) => {
      const existing = dailyDataMap.get(row.date) || {
        date: row.date,
        completed_steps: 0,
        total_steps: 0,
        completed_habits: 0,
        total_habits: 0
      }
      existing.completed_steps = parseInt(row.completed_steps) || 0
      existing.total_steps = parseInt(row.total_steps) || 0
      dailyDataMap.set(row.date, existing)
    })

    // Add habit completion data
    habitCompletions.forEach((row: any) => {
      const existing = dailyDataMap.get(row.date) || {
        date: row.date,
        completed_steps: 0,
        total_steps: 0,
        completed_habits: 0,
        total_habits: 0
      }
      existing.completed_habits = parseInt(row.completed_habits) || 0
      dailyDataMap.set(row.date, existing)
    })

    // Calculate planned habits for each day
    allDates.forEach((dateStr) => {
      const date = new Date(dateStr)
      date.setHours(0, 0, 0, 0)
      
      let plannedHabitsCount = 0
      allHabits.forEach((habit: any) => {
        if (isHabitScheduledForDay(habit, date)) {
          plannedHabitsCount++
        }
      })
      
      const existing = dailyDataMap.get(dateStr) || {
        date: dateStr,
        completed_steps: 0,
        total_steps: 0,
        completed_habits: 0,
        total_habits: 0
      }
      existing.total_habits = plannedHabitsCount
      dailyDataMap.set(dateStr, existing)
    })

    const dailyData = Array.from(dailyDataMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    // Calculate weekly aggregations for overview
    let weeklyData: any[] = []
    if (period === 'all') {
      const weeklyMap = new Map<string, { week: string; completed_steps: number; total_steps: number; completed_habits: number; total_habits: number }>()
      
      dailyData.forEach((day: any) => {
        const date = new Date(day.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        const existing = weeklyMap.get(weekKey) || {
          week: weekKey,
          completed_steps: 0,
          total_steps: 0,
          completed_habits: 0,
          total_habits: 0
        }
        
        existing.completed_steps += day.completed_steps || 0
        existing.total_steps += day.total_steps || 0
        existing.completed_habits += day.completed_habits || 0
        existing.total_habits += day.total_habits || 0
        
        weeklyMap.set(weekKey, existing)
      })
      
      weeklyData = Array.from(weeklyMap.values()).sort((a, b) => a.week.localeCompare(b.week))
    }

    // Calculate monthly aggregations for year view
    let monthlyData: any[] = []
    if (period === 'year') {
      const monthlyMap = new Map<string, { month: string; completed_steps: number; total_steps: number; completed_habits: number; total_habits: number }>()
      
      dailyData.forEach((day: any) => {
        const date = new Date(day.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        const existing = monthlyMap.get(monthKey) || {
          month: monthKey,
          completed_steps: 0,
          total_steps: 0,
          completed_habits: 0,
          total_habits: 0
        }
        
        existing.completed_steps += day.completed_steps
        existing.total_steps += day.total_steps
        existing.completed_habits += day.completed_habits
        existing.total_habits += day.total_habits || 0
        
        monthlyMap.set(monthKey, existing)
      })
      
      monthlyData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
    }

    return NextResponse.json({
      period,
      startDate: startDateStr,
      endDate: endDateStr,
      steps: {
        total: parseInt(steps.total) || 0,
        completed: parseInt(steps.completed) || 0,
        planned: parseInt(steps.planned_in_period) || 0,
        completionRate: steps.planned_in_period > 0 
          ? Math.round((parseInt(steps.completed) / parseInt(steps.planned_in_period)) * 100)
          : 0
      },
      habits: {
        total: habits.total || 0,
        completed: habits.completed || 0,
        completionRate: habits.total > 0
          ? Math.round((habits.completed / habits.total) * 100)
          : 0
      },
      goals: {
        total: parseInt(goals.total) || 0,
        completed: parseInt(goals.completed) || 0,
        completionRate: goals.total > 0
          ? Math.round((parseInt(goals.completed) / parseInt(goals.total)) * 100)
          : 0
      },
      dailyData,
      weeklyData,
      monthlyData
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

