import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { sql } from '@/lib/database'

const VALID_STATUSES = ['inbox', 'saved', 'in_progress', 'drafted', 'published', 'archived']

export async function PATCH(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { briefId, status, notes, published_url } = await request.json()

    if (!briefId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid briefId or status' }, { status: 400 })
    }

    if (status === 'published') {
      await sql`
        UPDATE pipeline_briefs SET
          pipeline_status = ${status},
          pipeline_notes = COALESCE(${notes || null}, pipeline_notes),
          published_at = NOW(),
          published_url = ${published_url || null},
          is_used = true
        WHERE id = ${briefId}
      `
    } else if (status === 'saved') {
      await sql`
        UPDATE pipeline_briefs SET
          pipeline_status = ${status},
          pipeline_notes = COALESCE(${notes || null}, pipeline_notes),
          saved_at = NOW()
        WHERE id = ${briefId}
      `
    } else {
      await sql`
        UPDATE pipeline_briefs SET
          pipeline_status = ${status},
          pipeline_notes = COALESCE(${notes || null}, pipeline_notes)
        WHERE id = ${briefId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed', details: String(error) }, { status: 500 })
  }
}
