import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

/**
 * Public API endpoint to fetch help sections by category slug
 * No authentication required - public help content
 * 
 * GET /api/help/sections?category=getting-started
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')

    if (!categorySlug) {
      return NextResponse.json({ error: 'Missing query param: category' }, { status: 400 })
    }

    // Ensure tables exist (in case of fresh deployment)
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
      await sql`
        CREATE TABLE IF NOT EXISTS help_sections (
          id VARCHAR(255) PRIMARY KEY,
          category_id VARCHAR(255) REFERENCES help_categories(id) ON DELETE CASCADE,
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
        console.error('Error creating tables:', tableError)
      }
    }

    // Get category by slug
    const categoryResult = await sql`
      SELECT id FROM help_categories
      WHERE slug = ${categorySlug} AND is_active = TRUE
    `

    if (categoryResult.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const categoryId = categoryResult[0].id

    // Get sections for this category
    const result = await sql`
      SELECT * FROM help_sections
      WHERE category_id = ${categoryId} AND is_active = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `

    // Parse JSONB fields if they come as strings
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

