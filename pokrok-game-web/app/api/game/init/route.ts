import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getPlayerByUserId, getGoalsByUserId, getHabitsByUserId } from '@/lib/cesta-db'
import { initializeOnboardingSteps } from '@/lib/onboarding-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY & PERFORMANCE: Použít requireAuth helper
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user needs onboarding steps initialized
    // Skip this check if user has already completed onboarding to improve performance
    if (!dbUser.has_completed_onboarding) {
      try {
        // Check if user has onboarding area "Začínáme" or "Getting Started"
        const existingArea = await sql`
          SELECT id FROM areas 
          WHERE user_id = ${dbUser.id} 
          AND (name = 'Začínáme' OR name = 'Getting Started')
          LIMIT 1
        `
      
      if (existingArea.length === 0) {
        // User doesn't have onboarding area yet, initialize onboarding steps
        const userSettings = await sql`
          SELECT locale FROM user_settings WHERE user_id = ${dbUser.id}
        `
        const locale = userSettings[0]?.locale || 'cs'
        
        // Initialize onboarding steps synchronously
        try {
          await initializeOnboardingSteps(dbUser.id, locale)
          console.log('✅ Onboarding steps initialized for user:', dbUser.id)
        } catch (initError) {
          console.error('Error initializing onboarding steps:', initError)
          if (initError instanceof Error) {
            console.error('Error message:', initError.message)
            console.error('Error stack:', initError.stack)
          }
          // Don't fail the request if onboarding init fails
        }
      } else {
        // Check if they have steps in this area
        const existingSteps = await sql`
          SELECT id FROM daily_steps 
          WHERE user_id = ${dbUser.id} 
          AND area_id = ${existingArea[0].id}
          LIMIT 1
        `
        
        if (existingSteps.length === 0) {
          // User has area but no steps, initialize steps
          const userSettings = await sql`
            SELECT locale FROM user_settings WHERE user_id = ${dbUser.id}
          `
          const locale = userSettings[0]?.locale || 'cs'
          
          try {
            await initializeOnboardingSteps(dbUser.id, locale)
            console.log('✅ Onboarding steps initialized for user (had area but no steps):', dbUser.id)
          } catch (initError) {
            console.error('Error initializing onboarding steps:', initError)
            if (initError instanceof Error) {
              console.error('Error message:', initError.message)
              console.error('Error stack:', initError.stack)
            }
          }
        }
      }
      } catch (error) {
        console.error('Error checking onboarding steps:', error)
        // Don't fail the request if check fails
      }
    }

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

