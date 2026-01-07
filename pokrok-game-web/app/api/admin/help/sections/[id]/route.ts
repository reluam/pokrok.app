import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const result = await sql`SELECT * FROM help_sections WHERE id = ${id}`
    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const row = result[0]
    row.title = typeof row.title === 'string' ? JSON.parse(row.title) : row.title
    row.content = row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
    return NextResponse.json(row)
  } catch (error: any) {
    console.error('Error fetching help section:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, component_key, sort_order, is_active, category_id } = body

    const existing = await sql`SELECT * FROM help_sections WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const current = existing[0]

    const finalTitle = title !== undefined ? JSON.stringify(title) : JSON.stringify(current.title)
    const finalContent = content !== undefined 
      ? (content ? JSON.stringify(content) : null)
      : (current.content ? (typeof current.content === 'string' ? current.content : JSON.stringify(current.content)) : null)
    const finalComponent = component_key !== undefined ? (component_key || null) : current.component_key
    const finalSort = sort_order !== undefined ? sort_order : current.sort_order
    const finalActive = is_active !== undefined ? is_active : current.is_active
    const finalCategory = category_id !== undefined ? category_id : current.category_id

    const result = finalContent
      ? await sql`
          UPDATE help_sections
          SET
            title = ${finalTitle}::jsonb,
            content = ${finalContent}::jsonb,
            component_key = ${finalComponent},
            sort_order = ${finalSort},
            is_active = ${finalActive},
            category_id = ${finalCategory},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
      : await sql`
          UPDATE help_sections
          SET
            title = ${finalTitle}::jsonb,
            content = NULL,
            component_key = ${finalComponent},
            sort_order = ${finalSort},
            is_active = ${finalActive},
            category_id = ${finalCategory},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
    const row = result[0]
    row.title = typeof row.title === 'string' ? JSON.parse(row.title) : row.title
    row.content = row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
    return NextResponse.json(row)
  } catch (error: any) {
    console.error('Error updating help section:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const result = await sql`DELETE FROM help_sections WHERE id = ${id} RETURNING id`
    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error: any) {
    console.error('Error deleting help section:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


