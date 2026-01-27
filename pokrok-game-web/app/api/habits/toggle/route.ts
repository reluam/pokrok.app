import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyEntityOwnership } from '@/lib/auth-helpers'
import { toggleHabitCompletion, getHabitsByUserId } from '@/lib/cesta-db'
import { decryptFields } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { habitId, date } = await request.json()
    
    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví habit
    const habitOwned = await verifyEntityOwnership(habitId, 'habits', dbUser)
    if (!habitOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Toggle habit completion for the specified date (or today if not specified)
    const result = await toggleHabitCompletion(dbUser.id, habitId, date)
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to toggle habit' }, { status: 500 })
    }

    // ✅ PERFORMANCE: Načíst pouze tento habit místo všech habits
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')
    
    const habitResult = await sql`
      SELECT h.*, 
             COALESCE(
               json_object_agg(
                 TO_CHAR(hc.completion_date, 'YYYY-MM-DD'), 
                 hc.completed
               ) FILTER (WHERE hc.completion_date IS NOT NULL),
               '{}'::json
             ) as habit_completions
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.id = ${habitId} AND h.user_id = ${dbUser.id}
      GROUP BY h.id
    `
    
    if (habitResult.length === 0) {
      return NextResponse.json({ error: 'Habit not found after update' }, { status: 404 })
    }
    
    const habitCompletions = habitResult[0].habit_completions || {}
    
    // Add completed_today for compatibility
    const today = date || new Date().toISOString().split('T')[0]
    const completedToday = habitCompletions[today] === true
    
    // Decrypt fields before returning
    const decrypted = decryptFields(habitResult[0], dbUser.id, ['name', 'description'])
    
    const updatedHabit = {
      ...decrypted,
      habit_completions: habitCompletions,
      completed_today: completedToday
    }

    return NextResponse.json(updatedHabit)

  } catch (error) {
    console.error('Error toggling habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
