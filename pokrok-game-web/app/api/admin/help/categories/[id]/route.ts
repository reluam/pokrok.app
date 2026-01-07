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
    const result = await sql`SELECT * FROM help_categories WHERE id = ${id}`
    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const row = result[0]
    row.title = typeof row.title === 'string' ? JSON.parse(row.title) : row.title
    row.description = row.description ? (typeof row.description === 'string' ? JSON.parse(row.description) : row.description) : null
    return NextResponse.json(row)
  } catch (error: any) {
    console.error('Error fetching help category:', error)
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
    const { title, description, slug, sort_order, is_active } = body

    const existing = await sql`SELECT * FROM help_categories WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const current = existing[0]

    const finalTitle = title !== undefined ? JSON.stringify(title) : JSON.stringify(current.title)
    const finalDescription = description !== undefined 
      ? (description ? JSON.stringify(description) : null)
      : (current.description ? (typeof current.description === 'string' ? current.description : JSON.stringify(current.description)) : null)
    const finalSlug = slug !== undefined ? (slug || null) : current.slug
    const finalSort = sort_order !== undefined ? sort_order : current.sort_order
    const finalActive = is_active !== undefined ? is_active : current.is_active

    const result = finalDescription
      ? await sql`
          UPDATE help_categories
          SET
            title = ${finalTitle}::jsonb,
            description = ${finalDescription}::jsonb,
            slug = ${finalSlug},
            sort_order = ${finalSort},
            is_active = ${finalActive},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
      : await sql`
          UPDATE help_categories
          SET
            title = ${finalTitle}::jsonb,
            description = NULL,
            slug = ${finalSlug},
            sort_order = ${finalSort},
            is_active = ${finalActive},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
    const row = result[0]
    row.title = typeof row.title === 'string' ? JSON.parse(row.title) : row.title
    row.description = row.description ? (typeof row.description === 'string' ? JSON.parse(row.description) : row.description) : null
    return NextResponse.json(row)
  } catch (error: any) {
    console.error('Error updating help category:', error)
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
    const result = await sql`DELETE FROM help_categories WHERE id = ${id} RETURNING id`
    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error: any) {
    console.error('Error deleting help category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


