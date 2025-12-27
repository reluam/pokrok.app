import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

// Available calendar view types
export const AVAILABLE_VIEWS = {
  day: {
    key: 'day',
    nameKey: 'calendar.day',
    descriptionKey: 'views.dailyDesc',
    requiresPremium: false,
    icon: 'Calendar'
  },
  week: {
    key: 'week',
    nameKey: 'calendar.week',
    descriptionKey: 'views.weeklyDesc',
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

