import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, updateUserPreferredLocale, invalidateUserCache } from '@/lib/cesta-db'
import { locales, type Locale } from '@/i18n/config'

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { locale } = body

    // Validate locale
    if (locale && !locales.includes(locale as Locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
    }

    // Update preferred locale (can be null to use browser default)
    const updatedUser = await updateUserPreferredLocale(dbUser.id, locale || null)
    
    // Invalidate cache (already done in updateUserPreferredLocale, but doing it again to be sure)
    invalidateUserCache(clerkUserId)

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user locale:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 })
  }
}

