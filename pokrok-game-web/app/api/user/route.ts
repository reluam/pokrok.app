import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { createUser } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    // Support both auth-based and clerkId query param
    const { searchParams } = new URL(request.url)
    const clerkIdParam = searchParams.get('clerkId')
    
    if (clerkIdParam) {
      // If clerkId is provided, use it (for backward compatibility)
      const { getUserByClerkId } = await import('@/lib/cesta-db')
      console.log('[API/user] GET request with clerkId:', clerkIdParam)
      const user = await getUserByClerkId(clerkIdParam)
      console.log('[API/user] User found:', !!user, user ? `id: ${user.id}` : 'null')
      
      if (!user) {
        console.error('[API/user] User not found for clerkId:', clerkIdParam)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      return NextResponse.json(user)
    } else {
      // Otherwise, use auth-based approach
      const authResult = await requireAuth(request)
      if (authResult instanceof NextResponse) return authResult
      const { dbUser } = authResult

      // ✅ SECURITY: Vrátit pouze data autentizovaného uživatele
      return NextResponse.json(dbUser)
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { clerkUserId, dbUser } = authResult

    // ✅ SECURITY: Pokud uživatel existuje, vrátit ho místo vytváření nového
    if (dbUser) {
      console.log('[API/user] User already exists, returning existing user:', dbUser.id)
      return NextResponse.json(dbUser)
    }

    const body = await request.json()
    const { email, firstName, lastName } = body
    
    // Use email or construct from other fields
    const userEmail = email || `${clerkUserId}@example.com`
    // Construct name from firstName and lastName, or use email username as fallback
    const name = [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'User'

    // Get locale from cookie (set by LanguageSwitcher on unauthenticated page)
    // Priority: cookie > default 'cs'
    const cookieStore = request.cookies
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
    const locale = (cookieLocale === 'en' || cookieLocale === 'cs') ? cookieLocale : 'cs'
    
    console.log('[API/user] Creating user with locale:', locale, '(from cookie:', cookieLocale, ')')

    // ✅ SECURITY: Použít clerkUserId z autentizace, ne z body
    // Pass locale to createUser so onboarding steps are created in the correct language
    const user = await createUser(clerkUserId, userEmail, name, locale)
    console.log('[API/user] New user created:', user.id, 'with onboarding steps in locale:', locale)
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: errorMessage 
    }, { status: 500 })
  }
}
