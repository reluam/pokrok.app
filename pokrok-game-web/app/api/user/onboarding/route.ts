import { NextRequest, NextResponse } from 'next/server'
import { updateUserOnboardingStatus } from '@/lib/cesta-db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, hasCompletedOnboarding } = body
    
    if (!userId || typeof hasCompletedOnboarding !== 'boolean') {
      return NextResponse.json({ error: 'User ID and onboarding status are required' }, { status: 400 })
    }

    await updateUserOnboardingStatus(userId, hasCompletedOnboarding)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
