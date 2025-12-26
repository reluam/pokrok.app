import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { invalidateHabitsCache } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId, date, completed } = await request.json()
    
    console.log('Calendar update request:', { habitId, date, completed, userId })

    if (!habitId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví habit
    const { getUserByClerkId } = await import('@/lib/cesta-db')
    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const habitCheck = await sql`
      SELECT id, user_id FROM habits 
      WHERE id = ${habitId}
    `

    if (habitCheck.length === 0) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // ✅ SECURITY: Ověření, že habit patří uživateli
    if (habitCheck[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // dbUser už máme z výše
    const dbUserId = dbUser.id

    // Check if habit has start_date and handle start_date updates
    const habitInfo = await sql`
      SELECT start_date FROM habits WHERE id = ${habitId}
    `
    
    const clickedDate = new Date(date)
    clickedDate.setHours(0, 0, 0, 0)
    
    if (completed === true) {
      // When checking, if clicked date is earlier than start_date, update start_date
      if (habitInfo.length > 0) {
        const habitStartDate = habitInfo[0].start_date ? new Date(habitInfo[0].start_date) : null
        
        if (habitStartDate) {
          habitStartDate.setHours(0, 0, 0, 0)
          if (clickedDate < habitStartDate) {
            await sql`
              UPDATE habits 
              SET start_date = CAST(${date} AS DATE), updated_at = NOW()
              WHERE id = ${habitId}
            `
            console.log('Updated habit start_date to earlier date:', { habitId, date })
          }
        } else {
          // No start_date set, set it to clicked date
          await sql`
            UPDATE habits 
            SET start_date = CAST(${date} AS DATE), updated_at = NOW()
            WHERE id = ${habitId}
          `
          console.log('Set habit start_date to clicked date:', { habitId, date })
        }
      }
    }

    if (completed === null) {
      // Remove the completion record
      console.log('Deleting completion record for:', { habitId, dbUserId, date })
      await sql`
        DELETE FROM habit_completions 
        WHERE habit_id = ${habitId} AND user_id = ${dbUserId} AND completion_date = CAST(${date} AS DATE)
      `
      console.log('Deletion completed')
      
      // After deletion, update start_date to earliest completed date or today
      const completedDates = await sql`
        SELECT completion_date 
        FROM habit_completions 
        WHERE habit_id = ${habitId} 
          AND user_id = ${dbUserId} 
          AND completed = true
        ORDER BY completion_date ASC
        LIMIT 1
      `
      
      let newStartDate: string
      if (completedDates.length > 0 && completedDates[0].completion_date) {
        newStartDate = completedDates[0].completion_date.toISOString().split('T')[0]
      } else {
        // No completed dates, use today
        newStartDate = new Date().toISOString().split('T')[0]
      }
      
      await sql`
        UPDATE habits 
        SET start_date = CAST(${newStartDate} AS DATE), updated_at = NOW()
        WHERE id = ${habitId}
      `
      console.log('Updated habit start_date to earliest completed or today:', { habitId, newStartDate })
    } else if (completed === false) {
      // When unchecking (setting to false), update start_date to earliest completed date or today
      // First update the completion record
      console.log('Inserting/updating completion record:', { dbUserId, habitId, date, completed })
      await sql`
        INSERT INTO habit_completions (user_id, habit_id, completion_date, completed, created_at)
        VALUES (${dbUserId}, ${habitId}, CAST(${date} AS DATE), ${completed}, NOW())
        ON CONFLICT (user_id, habit_id, completion_date)
        DO UPDATE SET completed = ${completed}, updated_at = NOW()
      `
      console.log('Insert/update completed')
      
      // Then find earliest completed date or use today
      const completedDates = await sql`
        SELECT completion_date 
        FROM habit_completions 
        WHERE habit_id = ${habitId} 
          AND user_id = ${dbUserId} 
          AND completed = true
        ORDER BY completion_date ASC
        LIMIT 1
      `
      
      let newStartDate: string
      if (completedDates.length > 0 && completedDates[0].completion_date) {
        newStartDate = completedDates[0].completion_date.toISOString().split('T')[0]
      } else {
        // No completed dates, use today
        newStartDate = new Date().toISOString().split('T')[0]
      }
      
      await sql`
        UPDATE habits 
        SET start_date = CAST(${newStartDate} AS DATE), updated_at = NOW()
        WHERE id = ${habitId}
      `
      console.log('Updated habit start_date to earliest completed or today:', { habitId, newStartDate })
    } else {
      // Insert or update the completion record (completed === true)
      console.log('Inserting/updating completion record:', { dbUserId, habitId, date, completed })
      await sql`
        INSERT INTO habit_completions (user_id, habit_id, completion_date, completed, created_at)
        VALUES (${dbUserId}, ${habitId}, CAST(${date} AS DATE), ${completed}, NOW())
        ON CONFLICT (user_id, habit_id, completion_date)
        DO UPDATE SET completed = ${completed}, updated_at = NOW()
      `
      console.log('Insert/update completed')
    }

    // Invalidate habits cache BEFORE fetching fresh data
    invalidateHabitsCache(dbUserId)
    
    // Small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Fetch fresh data directly from database (bypassing cache)
    const { getHabitsByUserId } = await import('@/lib/cesta-db')
    // Force fresh fetch by passing forceFresh=true
    const updatedHabits = await getHabitsByUserId(dbUserId, true)
    const updatedHabit = updatedHabits.find((h: any) => h.id === habitId)
    
    if (!updatedHabit) {
      return NextResponse.json({ error: 'Habit not found after update' }, { status: 404 })
    }

    // Add completed_today for compatibility
    const today = new Date().toISOString().split('T')[0]
    const habitsWithToday = updatedHabits.map((habit: any) => ({
      ...habit,
      completed_today: habit.habit_completions?.[today] === true
    }))

    return NextResponse.json({ 
      success: true,
      habit: updatedHabit,
      habits: habitsWithToday // Return all habits with completed_today
    })
  } catch (error) {
    console.error('Error updating habit calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
