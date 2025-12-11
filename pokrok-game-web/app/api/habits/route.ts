import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyEntityOwnership } from '@/lib/auth-helpers'
import { createHabit, getHabitsByUserId, updateHabit, deleteHabit, invalidateHabitsCache } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if cache-busting parameter is present - if so, force fresh data
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.has('t')
    
    // Always use forceFresh when cache-busting parameter is present
    // Use the existing function that properly loads habit_completions
    // With short TTL (5 seconds), cache will auto-expire quickly after updates
    const habits = await getHabitsByUserId(dbUser.id, forceRefresh)
    
    // Add completed_today for compatibility
    const today = new Date().toISOString().split('T')[0]
    const habitsWithToday = habits.map(habit => ({
      ...habit,
      completed_today: habit.habit_completions?.[today] === true
    }))
    
    return NextResponse.json(habitsWithToday)
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { name, description, frequency, streak, maxStreak, category, difficulty, isCustom, reminderTime, notificationEnabled, selectedDays, alwaysShow, xpReward, aspirationId, areaId, order } = body
    
    // ✅ SECURITY: Ověření vlastnictví areaId, pokud je poskytnut
    if (areaId) {
      const areaOwned = await verifyEntityOwnership(areaId, 'areas', dbUser)
      if (!areaOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get max order for this user to put new habit at the end
    const maxOrderResult = await sql`
      SELECT COALESCE(MAX("order"), 0) as max_order
      FROM habits
      WHERE user_id = ${dbUser.id}
    `
    const maxOrder = maxOrderResult[0]?.max_order || 0
    
    const habitData = {
      user_id: dbUser.id,
      name,
      description: description || name,
      frequency: frequency || 'daily',
      streak: streak || 0,
      max_streak: maxStreak || 0,
      category: category || 'osobní',
      difficulty: difficulty || 'medium',
      is_custom: isCustom || false,
      reminder_time: reminderTime || null,
      notification_enabled: notificationEnabled || false,
      selected_days: selectedDays || null,
      always_show: alwaysShow || false,
      xp_reward: xpReward || 1,
      aspiration_id: aspirationId || null,
      area_id: areaId || null,
      order: order !== undefined ? order : maxOrder + 1,
      habit_completions: {}
    }

    const habit = await createHabit(habitData)
    
    if (!habit) {
      return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
    }
    
    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { habitId, name, description, frequency, category, difficulty, reminderTime, notificationEnabled, selectedDays, alwaysShow, xpReward, aspirationId, areaId, order } = body
    
    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví habit
    const habitOwned = await verifyEntityOwnership(habitId, 'habits', dbUser)
    if (!habitOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ✅ SECURITY: Ověření vlastnictví areaId, pokud je poskytnut
    if (areaId) {
      const areaOwned = await verifyEntityOwnership(areaId, 'areas', dbUser)
      if (!areaOwned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updates: any = {
      name,
      description,
      frequency,
      category,
      difficulty,
      reminder_time: reminderTime,
      notification_enabled: notificationEnabled,
      selected_days: selectedDays,
      always_show: alwaysShow,
      xp_reward: xpReward,
      aspiration_id: aspirationId,
      area_id: areaId !== undefined ? areaId : undefined
    }
    
    // Add order if provided
    if (order !== undefined) {
      updates.order = order
    }

    const habit = await updateHabit(habitId, updates)
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }
    
    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { habitId } = body
    
    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví habit
    const habitOwned = await verifyEntityOwnership(habitId, 'habits', dbUser)
    if (!habitOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await deleteHabit(habitId)
    if (!success) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
