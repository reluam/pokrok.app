import { NextRequest, NextResponse } from 'next/server'
import { getUserByClerkId, getPlayerByUserId, getGoalsByUserId, getHabitsByUserId } from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Native app endpoint - accepts clerkUserId as query param
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clerkUserId = searchParams.get('clerkUserId')
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Missing clerkUserId parameter' }, { status: 400 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Load all game data in parallel
    const [player, goals, habits] = await Promise.all([
      getPlayerByUserId(dbUser.id).catch(() => null),
      getGoalsByUserId(dbUser.id).catch(() => []),
      getHabitsByUserId(dbUser.id).catch(() => [])
    ])

    // Add completed_today for habits compatibility
    const today = new Date().toISOString().split('T')[0]
    const habitsWithToday = habits.map(habit => ({
      ...habit,
      completed_today: habit.habit_completions?.[today] === true
    }))

    return NextResponse.json({
      user: dbUser,
      player,
      goals,
      habits: habitsWithToday
    })
  } catch (error) {
    console.error('Error initializing game data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage
    }, { status: 500 })
  }
}

