import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { initializeOnboardingSteps } from '@/lib/onboarding-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Get user's locale for creating localized steps
    const userSettings = await sql`
      SELECT locale FROM user_settings WHERE user_id = ${dbUser.id}
    `
    const locale = userSettings[0]?.locale || 'cs'

    // Initialize onboarding steps
    await initializeOnboardingSteps(dbUser.id, locale)

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding steps initialized'
    })
  } catch (error) {
    console.error('Error initializing onboarding steps:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}
