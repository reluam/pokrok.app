import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    if (!dbUser.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Add progress column if it doesn't exist
    await sql`
      ALTER TABLE milestones 
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0
    `

    return NextResponse.json({ success: true, message: 'Progress column added to milestones table' })
  } catch (error) {
    console.error('Error adding progress column:', error)
    return NextResponse.json(
      { error: 'Failed to add progress column' },
      { status: 500 }
    )
  }
}
