import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getUserByClerkId, getPlayerByUserId, getGoalsByUserId, getHabitsByUserId, getDailyStepsByUserId } from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Native app endpoint - verifies native token from Authorization header
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }
    
    const token = authHeader.substring(7) // Remove "Bearer "
    
    // Verify the native token from database
    const sql = neon(process.env.DATABASE_URL!)
    let clerkUserId: string
    
    try {
      const result = await sql`
        SELECT clerk_user_id, expires_at 
        FROM native_tokens 
        WHERE token = ${token}
      `
      
      if (result.length === 0) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      
      const tokenData = result[0]
      
      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 })
      }
      
      clerkUserId = tokenData.clerk_user_id
      
      // Update last_used_at
      await sql`UPDATE native_tokens SET last_used_at = NOW() WHERE token = ${token}`
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Load all game data in parallel
    const [player, goals, habits, steps] = await Promise.all([
      getPlayerByUserId(dbUser.id).catch(() => null),
      getGoalsByUserId(dbUser.id).catch(() => []),
      getHabitsByUserId(dbUser.id).catch(() => []),
      getDailyStepsByUserId(dbUser.id).catch(() => [])
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
      habits: habitsWithToday,
      steps
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
