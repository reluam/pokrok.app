import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { createUser, createArea } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // ✅ SECURITY: Vrátit pouze data autentizovaného uživatele
    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return NextResponse.json(dbUser)
    }

    const body = await request.json()
    const { email, firstName, lastName } = body
    
    // Use email or construct from other fields
    const userEmail = email || `${clerkUserId}@example.com`
    // Construct name from firstName and lastName, or use email username as fallback
    const name = [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'User'

    // ✅ SECURITY: Použít clerkUserId z autentizace, ne z body
    const user = await createUser(clerkUserId, userEmail, name)
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}
