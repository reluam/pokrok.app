import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getPlayerByUserId, getGoalsByUserId, getHabitsByUserId } from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY & PERFORMANCE: Použít requireAuth helper
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Load all game data in parallel
    // Force fresh habits data to ensure latest completions are loaded
    const [player, goals, habits] = await Promise.all([
      getPlayerByUserId(dbUser.id).catch(() => null), // Player is optional
      getGoalsByUserId(dbUser.id).catch(() => []),
      getHabitsByUserId(dbUser.id, true).catch(() => []) // Force fresh data on page load
    ])

    // Add completed_today for habits compatibility
    const today = new Date().toISOString().split('T')[0]
    const habitsWithToday = habits.map(habit => ({
      ...habit,
      completed_today: habit.habit_completions?.[today] === true
    }))

    // Log user onboarding status for debugging
    console.log('[Game/Init] User onboarding status:', dbUser.has_completed_onboarding)

    return NextResponse.json({
      user: dbUser,
      player,
      goals,
      habits: habitsWithToday
    })
  } catch (error) {
    console.error('Error initializing game data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 })
  }
}

