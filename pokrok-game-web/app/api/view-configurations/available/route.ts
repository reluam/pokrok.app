import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

// Available calendar view types
export const AVAILABLE_VIEWS = {
  upcoming: {
    key: 'upcoming',
    nameKey: 'calendar.upcoming',
    descriptionKey: 'views.upcomingDesc',
    requiresPremium: false,
    icon: 'Calendar'
  },
  month: {
    key: 'month',
    nameKey: 'calendar.month',
    descriptionKey: 'views.monthlyDesc',
    requiresPremium: false,
    icon: 'Calendar'
  },
  year: {
    key: 'year',
    nameKey: 'calendar.year',
    descriptionKey: 'views.yearlyDesc',
    requiresPremium: false,
    icon: 'Calendar'
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    return NextResponse.json(Object.values(AVAILABLE_VIEWS))
  } catch (error) {
    console.error('Error fetching available views:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

