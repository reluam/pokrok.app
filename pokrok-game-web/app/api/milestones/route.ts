import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { decryptFields, encrypt } from '@/lib/encryption'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const areaId = searchParams.get('areaId')

    let milestones
    if (areaId) {
      milestones = await sql`
        SELECT * FROM milestones
        WHERE user_id = ${dbUser.id} AND area_id = ${areaId}
        ORDER BY completed_date ASC NULLS LAST, created_at ASC
      `
    } else {
      milestones = await sql`
        SELECT * FROM milestones
        WHERE user_id = ${dbUser.id}
        ORDER BY completed_date ASC NULLS LAST, created_at ASC
      `
    }

    // Decrypt milestones
    const decryptedMilestones = milestones.map(milestone =>
      decryptFields(milestone, dbUser.id, ['title', 'description'])
    )

    return NextResponse.json(decryptedMilestones)
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { areaId, title, description, completedDate, progress } = body

    if (!areaId || !title) {
      return NextResponse.json(
        { error: 'areaId and title are required' },
        { status: 400 }
      )
    }

    // Verify area belongs to user
    const area = await sql`
      SELECT id FROM areas WHERE id = ${areaId} AND user_id = ${dbUser.id}
    `
    if (area.length === 0) {
      return NextResponse.json(
        { error: 'Area not found' },
        { status: 404 }
      )
    }

    const id = crypto.randomUUID()
    
    // Encrypt text fields before inserting
    const encryptedTitle = encrypt(title, dbUser.id)
    const encryptedDescription = description ? encrypt(description, dbUser.id) : null

    const milestone = await sql`
      INSERT INTO milestones (
        id, user_id, area_id, title, description, completed_date, progress
      ) VALUES (
        ${id}, ${dbUser.id}, ${areaId}, ${encryptedTitle}, ${encryptedDescription}, ${completedDate || null}, ${progress || 0}
      ) RETURNING *
    `

    // Decrypt before returning
    const decrypted = decryptFields(milestone[0], dbUser.id, ['title', 'description'])

    return NextResponse.json(decrypted, { status: 201 })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}
