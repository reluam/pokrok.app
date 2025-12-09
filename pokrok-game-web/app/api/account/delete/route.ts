import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { clerkClient } from '@clerk/nextjs/server'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { clerkUserId, dbUser } = authResult

    // Smazat všechny data uživatele
    // Smazat všechny oblasti (areas)
    try {
      await sql`DELETE FROM areas WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from areas:', error.message)
      }
    }
    
    // Smazat všechny cíle (goals) - CASCADE smaže i související kroky
    try {
      await sql`DELETE FROM goals WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from goals:', error.message)
      }
    }
    
    // Smazat všechny kroky (daily_steps) - pro jistotu i ty bez cíle
    try {
      await sql`DELETE FROM daily_steps WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from daily_steps:', error.message)
      }
    }
    
    // Smazat všechny návyky (habits)
    try {
      await sql`DELETE FROM habits WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from habits:', error.message)
      }
    }
    
    // Smazat všechna dokončení návyků (habit_completions)
    try {
      await sql`DELETE FROM habit_completions WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from habit_completions:', error.message)
      }
    }
    
    // Smazat všechny workflows
    try {
      await sql`DELETE FROM workflows WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from workflows:', error.message)
      }
    }
    
    // Smazat všechny aspirace (aspirations)
    try {
      await sql`DELETE FROM aspirations WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from aspirations:', error.message)
      }
    }
    
    // Smazat všechny metriky (metrics)
    try {
      await sql`DELETE FROM metrics WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from metrics:', error.message)
      }
    }
    
    // Smazat všechny goal_metrics
    try {
      await sql`DELETE FROM goal_metrics WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from goal_metrics:', error.message)
      }
    }
    
    // Smazat všechny automations
    try {
      await sql`DELETE FROM automations WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from automations:', error.message)
      }
    }
    
    // Smazat všechny events
    try {
      await sql`DELETE FROM events WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from events:', error.message)
      }
    }
    
    // Smazat všechny daily_planning záznamy
    try {
      await sql`DELETE FROM daily_planning WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from daily_planning:', error.message)
      }
    }
    
    // Smazat user_settings
    try {
      await sql`DELETE FROM user_settings WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from user_settings:', error.message)
      }
    }
    
    // Smazat user_streak
    try {
      await sql`DELETE FROM user_streak WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from user_streak:', error.message)
      }
    }
    
    // Smazat player (postavu)
    try {
      await sql`DELETE FROM players WHERE user_id = ${dbUser.id}`
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Warning: Could not delete from players:', error.message)
      }
    }
    
    // Smazat uživatele z naší databáze
    await sql`DELETE FROM users WHERE id = ${dbUser.id}`

    // Smazat uživatele z Clerku
    try {
      const clerk = await clerkClient()
      await clerk.users.deleteUser(clerkUserId)
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError)
      // Pokračujeme i když se nepodařilo smazat z Clerku
      // (data z naší DB jsou už smazaná)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account has been deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

