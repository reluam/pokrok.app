import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

// Available workflows definitions
// Workflows are now standalone views, not tied to specific view types
export const AVAILABLE_WORKFLOWS = {
  only_the_important: {
    key: 'only_the_important',
    nameKey: 'views.onlyTheImportant.name',
    descriptionKey: 'views.onlyTheImportant.description',
    requiresPremium: true,
    icon: 'Target' // Use Target icon for "Only the important"
  },
  daily_review: {
    key: 'daily_review',
    nameKey: 'views.dailyReview.name',
    descriptionKey: 'views.dailyReview.description',
    requiresPremium: false,
    icon: 'BookOpen' // Use BookOpen icon for "Daily review"
  }
  // Přidat další workflows podle potřeby
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    return NextResponse.json(Object.values(AVAILABLE_WORKFLOWS))
  } catch (error) {
    console.error('Error fetching available views:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

