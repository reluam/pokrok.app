import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Ensure help_categories table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS help_categories (
          id VARCHAR(255) PRIMARY KEY,
          title JSONB NOT NULL,
          description JSONB,
          slug VARCHAR(100) UNIQUE,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      // Table might already exist, ignore if it's a "relation already exists" error
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating help_categories table:', tableError)
      }
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('is_active')

    let result
    if (isActive !== null) {
      const active = isActive === 'true'
      result = await sql`
        SELECT * FROM help_categories
        WHERE is_active = ${active}
        ORDER BY sort_order ASC, created_at DESC
      `
    } else {
      result = await sql`
        SELECT * FROM help_categories
        ORDER BY sort_order ASC, created_at DESC
      `
    }

    // Parse JSONB fields if strings
    const parsed = result.map((row: any) => ({
      ...row,
      title: typeof row.title === 'string' ? JSON.parse(row.title) : row.title,
      description: row.description ? (typeof row.description === 'string' ? JSON.parse(row.description) : row.description) : null
    }))

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Error fetching help categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Ensure help_categories table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS help_categories (
          id VARCHAR(255) PRIMARY KEY,
          title JSONB NOT NULL,
          description JSONB,
          slug VARCHAR(100) UNIQUE,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating help_categories table:', tableError)
      }
    }

    const body = await request.json()
    const { title, description, slug, sort_order = 0, is_active = true } = body
    if (!title) {
      return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 })
    }

    const id = randomUUID()
    const descriptionJson = description ? JSON.stringify(description) : null
    
    const result = descriptionJson
      ? await sql`
          INSERT INTO help_categories (id, title, description, slug, sort_order, is_active, created_by, created_at, updated_at)
          VALUES (${id}, ${JSON.stringify(title)}::jsonb, ${descriptionJson}::jsonb, ${slug || null}, ${sort_order}, ${is_active}, ${dbUser.id}, NOW(), NOW())
          RETURNING *
        `
      : await sql`
          INSERT INTO help_categories (id, title, description, slug, sort_order, is_active, created_by, created_at, updated_at)
          VALUES (${id}, ${JSON.stringify(title)}::jsonb, NULL, ${slug || null}, ${sort_order}, ${is_active}, ${dbUser.id}, NOW(), NOW())
          RETURNING *
        `

    const row = result[0]
    row.title = typeof row.title === 'string' ? JSON.parse(row.title) : row.title
    row.description = row.description ? (typeof row.description === 'string' ? JSON.parse(row.description) : row.description) : null
    return NextResponse.json(row, { status: 201 })
  } catch (error: any) {
    console.error('Error creating help category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


