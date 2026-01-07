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

    // Ensure help_sections table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS help_sections (
          id VARCHAR(255) PRIMARY KEY,
          category_id VARCHAR(255) NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
          title JSONB NOT NULL,
          content JSONB,
          component_key VARCHAR(100),
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating help_sections table:', tableError)
      }
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    if (!categoryId) {
      return NextResponse.json({ error: 'Missing query param: category_id' }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM help_sections
      WHERE category_id = ${categoryId}
      ORDER BY sort_order ASC, created_at DESC
    `

    const parsed = result.map((row: any) => ({
      ...row,
      title: typeof row.title === 'string' ? JSON.parse(row.title) : row.title,
      content: row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
    }))

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Error fetching help sections:', error)
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

    // Ensure help_sections table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS help_sections (
          id VARCHAR(255) PRIMARY KEY,
          category_id VARCHAR(255) NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
          title JSONB NOT NULL,
          content JSONB,
          component_key VARCHAR(100),
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating help_sections table:', tableError)
      }
    }

    const body = await request.json()
    const { category_id, title, content, component_key, sort_order = 0, is_active = true } = body
    if (!category_id || !title) {
      return NextResponse.json({ error: 'Missing required fields: category_id, title' }, { status: 400 })
    }

    const id = randomUUID()
    const contentJson = content ? JSON.stringify(content) : null
    
    const result = contentJson
      ? await sql`
          INSERT INTO help_sections (id, category_id, title, content, component_key, sort_order, is_active, created_by, created_at, updated_at)
          VALUES (${id}, ${category_id}, ${JSON.stringify(title)}::jsonb, ${contentJson}::jsonb, ${component_key || null}, ${sort_order}, ${is_active}, ${dbUser.id}, NOW(), NOW())
          RETURNING *
        `
      : await sql`
          INSERT INTO help_sections (id, category_id, title, content, component_key, sort_order, is_active, created_by, created_at, updated_at)
          VALUES (${id}, ${category_id}, ${JSON.stringify(title)}::jsonb, NULL, ${component_key || null}, ${sort_order}, ${is_active}, ${dbUser.id}, NOW(), NOW())
          RETURNING *
        `

    const row = result[0]
    row.title = typeof row.title === 'string' ? JSON.parse(row.title) : row.title
    row.content = row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
    return NextResponse.json(row, { status: 201 })
  } catch (error: any) {
    console.error('Error creating help section:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


