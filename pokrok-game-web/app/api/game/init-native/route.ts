import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@clerk/backend'
import { getUserByClerkId, getPlayerByUserId, getGoalsByUserId, getHabitsByUserId } from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Native app endpoint - verifies JWT token from Authorization header
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }
    
    const token = authHeader.substring(7) // Remove "Bearer "
    
    // Verify the JWT token with Clerk
    let clerkUserId: string
    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })
      clerkUserId = verifiedToken.sub
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
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
