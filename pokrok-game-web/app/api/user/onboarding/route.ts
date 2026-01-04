import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, updateUserOnboardingStatus, invalidateUserCache } from '@/lib/cesta-db'

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[Onboarding] PUT request for user:', dbUser.id, 'current has_completed_onboarding:', dbUser.has_completed_onboarding)

    const body = await request.json().catch(() => ({}))
    const hasCompletedOnboarding = body.hasCompletedOnboarding !== undefined 
      ? body.hasCompletedOnboarding 
      : true
    
    console.log('[Onboarding] hasCompletedOnboarding from request:', hasCompletedOnboarding)

    // Simply update onboarding status in database
    await updateUserOnboardingStatus(dbUser.id, hasCompletedOnboarding)
    
    // Explicitly invalidate cache for this user to ensure fresh data on next request
    invalidateUserCache(clerkUserId)
    
    // Wait a moment to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Fetch fresh data directly from database (bypassing cache)
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')
    const updatedUser = await sql`
      SELECT id, clerk_user_id, email, name, has_completed_onboarding, preferred_locale, created_at, updated_at
      FROM users
      WHERE id = ${dbUser.id}
    `
    
    console.log('[Onboarding] Updated user from database:', updatedUser[0]?.has_completed_onboarding)
    console.log('[Onboarding] Cache invalidated for clerkUserId:', clerkUserId)
    
    if (!updatedUser[0] || updatedUser[0].has_completed_onboarding !== hasCompletedOnboarding) {
      console.error('[Onboarding] WARNING: Database update may not have succeeded!')
      console.error('[Onboarding] Expected:', hasCompletedOnboarding, 'Got:', updatedUser[0]?.has_completed_onboarding)
    }
    
    return NextResponse.json({ 
      success: true,
      user: updatedUser[0] // Return updated user to confirm the change
    })
  } catch (error) {
    console.error('Error updating onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
