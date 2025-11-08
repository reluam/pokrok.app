import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, getPlayerByUserId, getGoalsByUserId, getHabitsByUserId } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Load all game data in parallel
    const [player, goals, habits] = await Promise.all([
      getPlayerByUserId(dbUser.id).catch(() => null), // Player is optional
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
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 })
  }
}

