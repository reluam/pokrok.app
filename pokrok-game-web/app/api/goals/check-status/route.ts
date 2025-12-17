import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { checkAndUpdateGoalsStatus } from '@/lib/cesta-db'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { userId } = body
    
    // ✅ SECURITY: Ověření vlastnictví userId
    if (userId && userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const targetUserId = userId || dbUser.id
    
    // Check and update goal statuses based on start_date
    await checkAndUpdateGoalsStatus(targetUserId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error checking goal statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

