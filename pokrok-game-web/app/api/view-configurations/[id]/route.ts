import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { id } = await params
    const body = await request.json()
    const { settings, enabled, order_index } = body

    // ✅ SECURITY: Ověření vlastnictví
    const existing = await sql`
      SELECT user_id FROM view_configurations WHERE id = ${id}
    `
    
    if (existing.length === 0) {
      return NextResponse.json({ error: 'View configuration not found' }, { status: 404 })
    }
    
    if (existing[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update query conditionally
    let updated
    const settingsJson = settings !== undefined ? (settings ? JSON.stringify(settings) : null) : undefined
    
    if (settings !== undefined && enabled !== undefined && order_index !== undefined) {
      // Update all fields
      if (settingsJson) {
        updated = await sql`
          UPDATE view_configurations 
          SET enabled = ${enabled}, 
              settings = ${settingsJson}::jsonb,
              order_index = ${order_index},
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      } else {
        updated = await sql`
          UPDATE view_configurations 
          SET enabled = ${enabled}, 
              settings = NULL,
              order_index = ${order_index},
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      }
    } else if (settings !== undefined && enabled !== undefined) {
      // Update settings and enabled
      if (settingsJson) {
        updated = await sql`
          UPDATE view_configurations 
          SET enabled = ${enabled}, 
              settings = ${settingsJson}::jsonb,
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      } else {
        updated = await sql`
          UPDATE view_configurations 
          SET enabled = ${enabled}, 
              settings = NULL,
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      }
    } else if (enabled !== undefined && order_index !== undefined) {
      // Update enabled and order_index
      updated = await sql`
        UPDATE view_configurations 
        SET enabled = ${enabled},
            order_index = ${order_index},
            updated_at = NOW()
        WHERE id = ${id} AND user_id = ${dbUser.id}
        RETURNING *
      `
    } else if (settings !== undefined && order_index !== undefined) {
      // Update settings and order_index
      if (settingsJson) {
        updated = await sql`
          UPDATE view_configurations 
          SET settings = ${settingsJson}::jsonb,
              order_index = ${order_index},
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      } else {
        updated = await sql`
          UPDATE view_configurations 
          SET settings = NULL,
              order_index = ${order_index},
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      }
    } else if (enabled !== undefined) {
      // Update only enabled
      updated = await sql`
        UPDATE view_configurations 
        SET enabled = ${enabled},
            updated_at = NOW()
        WHERE id = ${id} AND user_id = ${dbUser.id}
        RETURNING *
      `
    } else if (settings !== undefined) {
      // Update only settings
      if (settingsJson) {
        updated = await sql`
          UPDATE view_configurations 
          SET settings = ${settingsJson}::jsonb,
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      } else {
        updated = await sql`
          UPDATE view_configurations 
          SET settings = NULL,
              updated_at = NOW()
          WHERE id = ${id} AND user_id = ${dbUser.id}
          RETURNING *
        `
      }
    } else if (order_index !== undefined) {
      // Update only order_index
      updated = await sql`
        UPDATE view_configurations 
        SET order_index = ${order_index},
            updated_at = NOW()
        WHERE id = ${id} AND user_id = ${dbUser.id}
        RETURNING *
      `
    } else {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    if (updated.length === 0) {
      return NextResponse.json({ error: 'View configuration not found' }, { status: 404 })
    }
    
    return NextResponse.json(updated[0])
  } catch (error: any) {
    console.error('Error updating view configuration:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { id } = await params

    // ✅ SECURITY: Ověření vlastnictví
    const existing = await sql`
      SELECT user_id FROM view_configurations WHERE id = ${id}
    `
    
    if (existing.length === 0) {
      return NextResponse.json({ error: 'View configuration not found' }, { status: 404 })
    }
    
    if (existing[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await sql`
      DELETE FROM view_configurations 
      WHERE id = ${id} AND user_id = ${dbUser.id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting view configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

