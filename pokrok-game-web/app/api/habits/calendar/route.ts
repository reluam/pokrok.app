import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

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

    if (completed === null) {
      // Remove the completion record
      console.log('Deleting completion record for:', { habitId, dbUserId, date })
      await sql`
        DELETE FROM habit_completions 
        WHERE habit_id = ${habitId} AND user_id = ${dbUserId} AND completion_date = CAST(${date} AS DATE)
      `
      console.log('Deletion completed')
    } else {
      // Insert or update the completion record
      console.log('Inserting/updating completion record:', { dbUserId, habitId, date, completed })
      await sql`
        INSERT INTO habit_completions (user_id, habit_id, completion_date, completed, created_at)
        VALUES (${dbUserId}, ${habitId}, CAST(${date} AS DATE), ${completed}, NOW())
        ON CONFLICT (user_id, habit_id, completion_date)
        DO UPDATE SET completed = ${completed}, updated_at = NOW()
      `
      console.log('Insert/update completed')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating habit calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
