import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, toggleHabitCompletion, getHabitsByUserId } from '@/lib/cesta-db'

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId, date } = await request.json()
    
    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Toggle habit completion for the specified date (or today if not specified)
    const result = await toggleHabitCompletion(dbUser.id, habitId, date)
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to toggle habit' }, { status: 500 })
    }

    // Reload the full habit to get updated habit_completions
    const allHabits = await getHabitsByUserId(dbUser.id)
    const updatedHabit = allHabits.find(h => h.id === habitId)
    
    if (!updatedHabit) {
      return NextResponse.json({ error: 'Habit not found after update' }, { status: 404 })
    }

    return NextResponse.json(updatedHabit)

  } catch (error) {
    console.error('Error toggling habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
