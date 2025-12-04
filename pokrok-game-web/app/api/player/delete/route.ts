import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function DELETE(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
    const result = await sql`DELETE FROM players WHERE user_id = ${targetUserId} RETURNING id`
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Player deleted successfully' })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 })
  }
}
