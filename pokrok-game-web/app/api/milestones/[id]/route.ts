import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { decryptFields, encrypt } from '@/lib/encryption'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { id } = await params

    const milestone = await sql`
      SELECT * FROM milestones
      WHERE id = ${id} AND user_id = ${dbUser.id}
    `

    if (milestone.length === 0) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Decrypt before returning
    const decrypted = decryptFields(milestone[0], dbUser.id, ['title', 'description'])

    return NextResponse.json(decrypted)
  } catch (error) {
    console.error('Error fetching milestone:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { id } = await params
    const body = await request.json()
    const { title, description, completedDate, progress } = body

    // Verify milestone belongs to user
    const existing = await sql`
      SELECT * FROM milestones WHERE id = ${id} AND user_id = ${dbUser.id}
    `
    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Build update query - get current values first
    const current = existing[0]
    
    // Encrypt fields if provided, otherwise use current encrypted values
    const encryptedTitle = title !== undefined ? encrypt(title, dbUser.id) : current.title
    const encryptedDescription = description !== undefined 
      ? (description ? encrypt(description, dbUser.id) : null)
      : current.description
    const finalCompletedDate = completedDate !== undefined ? completedDate : current.completed_date
    const finalProgress = progress !== undefined ? progress : (current.progress || 0)

    // Try to update with progress column first, fallback to without progress if column doesn't exist
    let milestone
    try {
      milestone = await sql`
        UPDATE milestones
        SET 
          title = ${encryptedTitle},
          description = ${encryptedDescription},
          completed_date = ${finalCompletedDate},
          progress = ${finalProgress},
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${dbUser.id}
        RETURNING *
      `
    } catch (updateError: any) {
      // If progress column doesn't exist, try without it
      if (updateError?.code === '42703' || updateError?.message?.includes('column "progress" does not exist')) {
        console.log('Progress column not found, updating without progress column')
        milestone = await sql`
          UPDATE milestones
          SET 
            title = ${encryptedTitle},
            description = ${encryptedDescription},
            completed_date = ${finalCompletedDate},
            updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      } else {
        throw updateError
      }
    }

    // Decrypt before returning
    const decrypted = decryptFields(milestone[0], dbUser.id, ['title', 'description'])

    return NextResponse.json(decrypted)
  } catch (error: any) {
    console.error('Error updating milestone:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint
    })
    return NextResponse.json(
      { 
        error: 'Failed to update milestone',
        details: error?.message || 'Unknown error',
        code: error?.code
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { id } = await params

    // Verify milestone belongs to user
    const existing = await sql`
      SELECT id FROM milestones WHERE id = ${id} AND user_id = ${dbUser.id}
    `
    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    await sql`
      DELETE FROM milestones WHERE id = ${id} AND user_id = ${dbUser.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return NextResponse.json(
      { error: 'Failed to delete milestone' },
      { status: 500 }
    )
  }
}
