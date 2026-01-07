import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

interface AssistantTip {
  id: string
  title: Record<string, string> // JSONB - {cs: "...", en: "..."}
  description: Record<string, string> // JSONB
  category: 'motivation' | 'organization' | 'productivity' | 'feature' | 'onboarding'
  priority: number
  context_page?: string | null
  context_section?: string | null
  is_active: boolean
  conditions?: Record<string, { operator: string; value: any }> | null // JSONB - conditions for showing tip
  created_by?: string | null
  created_at: Date
  updated_at: Date
}

// GET - Get all tips (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Ensure assistant_tips table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS assistant_tips (
          id VARCHAR(255) PRIMARY KEY,
          title JSONB NOT NULL,
          description JSONB NOT NULL,
          category VARCHAR(50) NOT NULL CHECK (category IN ('motivation', 'organization', 'productivity', 'feature', 'onboarding', 'inspiration')),
          priority INTEGER DEFAULT 0,
          context_page VARCHAR(50),
          context_section VARCHAR(50),
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      // Table might already exist, ignore if it's a "relation already exists" error
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating assistant_tips table:', tableError)
      }
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')

    let result
    if (category && isActive !== null) {
      const active = isActive === 'true'
      result = await sql`
        SELECT * FROM assistant_tips 
        WHERE category = ${category} AND is_active = ${active}
        ORDER BY priority DESC, created_at DESC
      `
    } else if (category) {
      result = await sql`
        SELECT * FROM assistant_tips 
        WHERE category = ${category}
        ORDER BY priority DESC, created_at DESC
      `
    } else if (isActive !== null) {
      const active = isActive === 'true'
      result = await sql`
        SELECT * FROM assistant_tips 
        WHERE is_active = ${active}
        ORDER BY priority DESC, created_at DESC
      `
    } else {
      result = await sql`
        SELECT * FROM assistant_tips 
        ORDER BY priority DESC, created_at DESC
      `
    }

    // Parse JSONB fields if they come as strings
    const parsedResult = result.map((tip: any) => ({
      ...tip,
      title: typeof tip.title === 'string' ? JSON.parse(tip.title) : tip.title,
      description: typeof tip.description === 'string' ? JSON.parse(tip.description) : tip.description,
      conditions: tip.conditions ? (typeof tip.conditions === 'string' ? JSON.parse(tip.conditions) : tip.conditions) : null
    }))

    return NextResponse.json(parsedResult)
  } catch (error: any) {
    console.error('Error fetching tips:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

// POST - Create new tip (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category, priority = 0, context_page, context_section, is_active = true, conditions } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields: title, description, category' }, { status: 400 })
    }

    // Validate category
    const validCategories = ['motivation', 'organization', 'productivity', 'feature', 'onboarding', 'inspiration']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }, { status: 400 })
    }

    const id = randomUUID()
    const conditionsJson = conditions ? JSON.stringify(conditions) : null
    
    const result = conditionsJson
      ? await sql`
          INSERT INTO assistant_tips (id, title, description, category, priority, context_page, context_section, is_active, conditions, created_by, created_at, updated_at)
          VALUES (${id}, ${JSON.stringify(title)}::jsonb, ${JSON.stringify(description)}::jsonb, ${category}, ${priority}, ${context_page || null}, ${context_section || null}, ${is_active}, ${conditionsJson}::jsonb, ${dbUser.id}, NOW(), NOW())
          RETURNING *
        `
      : await sql`
          INSERT INTO assistant_tips (id, title, description, category, priority, context_page, context_section, is_active, conditions, created_by, created_at, updated_at)
          VALUES (${id}, ${JSON.stringify(title)}::jsonb, ${JSON.stringify(description)}::jsonb, ${category}, ${priority}, ${context_page || null}, ${context_section || null}, ${is_active}, NULL, ${dbUser.id}, NOW(), NOW())
          RETURNING *
        `

    // Parse JSONB fields if they come as strings
    const parsedTip = result[0]
    if (parsedTip) {
      parsedTip.title = typeof parsedTip.title === 'string' ? JSON.parse(parsedTip.title) : parsedTip.title
      parsedTip.description = typeof parsedTip.description === 'string' ? JSON.parse(parsedTip.description) : parsedTip.description
      parsedTip.conditions = parsedTip.conditions ? (typeof parsedTip.conditions === 'string' ? JSON.parse(parsedTip.conditions) : parsedTip.conditions) : null
    }

    return NextResponse.json(parsedTip, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tip:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

