import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * Endpoint to fix onboarding tips categories
 * Changes category from 'feature', 'organization', 'productivity' to 'onboarding'
 * for tips that have IDs starting with 'onboarding-'
 * 
 * POST /api/setup/fix-onboarding-categories
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Find all tips that should be onboarding (IDs starting with 'onboarding-')
    const onboardingTipIds = [
      'onboarding-intro',
      'onboarding-assistant',
      'onboarding-setup',
      'onboarding-goals',
      'onboarding-areas',
      'onboarding-steps',
      'onboarding-habits',
      'onboarding-contact'
    ]

    // Update each tip's category to 'onboarding'
    const updatedTips = []
    for (const tipId of onboardingTipIds) {
      try {
        const result = await sql`
          UPDATE assistant_tips
          SET category = 'onboarding', updated_at = NOW()
          WHERE id = ${tipId}
          RETURNING id, category
        `
        if (result.length > 0) {
          updatedTips.push({ id: tipId, category: result[0].category })
        }
      } catch (error: any) {
        console.error(`Error updating tip ${tipId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedTips.length} onboarding tips to category 'onboarding'`,
      updatedTips
    })
  } catch (error: any) {
    console.error('Error fixing onboarding categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix onboarding categories',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy browser access
export async function GET(request: NextRequest) {
  return POST(request)
}

