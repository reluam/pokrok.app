import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createHabit, getHabitsByUserId, getUserByClerkId, updateHabit, deleteHabit } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

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

    // Use the existing function that properly loads habit_completions
    const habits = await getHabitsByUserId(dbUser.id)
    
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
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, frequency, streak, maxStreak, category, difficulty, isCustom, reminderTime, selectedDays, alwaysShow, xpReward, aspirationId } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

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
      selected_days: selectedDays || null,
      always_show: alwaysShow || false,
      xp_reward: xpReward || 1,
      aspiration_id: aspirationId || null,
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
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { habitId, name, description, frequency, category, difficulty, reminderTime, selectedDays, alwaysShow, xpReward, aspirationId } = body
    
    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
    }

    const updates = {
      name,
      description,
      frequency,
      category,
      difficulty,
      reminder_time: reminderTime,
      selected_days: selectedDays,
      always_show: alwaysShow,
      xp_reward: xpReward,
      aspiration_id: aspirationId
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
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { habitId } = body
    
    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
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
