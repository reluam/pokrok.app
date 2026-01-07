import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// GET - Get single tip (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const result = await sql`
      SELECT * FROM assistant_tips WHERE id = ${params.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 })
    }

    // Parse JSONB fields if they come as strings
    const parsedTip = result[0]
    parsedTip.title = typeof parsedTip.title === 'string' ? JSON.parse(parsedTip.title) : parsedTip.title
    parsedTip.description = typeof parsedTip.description === 'string' ? JSON.parse(parsedTip.description) : parsedTip.description

    return NextResponse.json(parsedTip)
  } catch (error: any) {
    console.error('Error fetching tip:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

// PUT - Update tip (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { title, description, category, priority, context_page, context_section, is_active, conditions } = body

    // Validate category if provided
    if (category) {
      const validCategories = ['motivation', 'organization', 'productivity', 'feature', 'onboarding', 'inspiration']
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }, { status: 400 })
      }
    }

    // Check if tip exists first
    const existing = await sql`
      SELECT * FROM assistant_tips WHERE id = ${params.id}
    `
    
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 })
    }

    const current = existing[0]
    
    // Use provided values or keep existing ones
    const finalTitle = title !== undefined ? JSON.stringify(title) : JSON.stringify(current.title)
    const finalDescription = description !== undefined ? JSON.stringify(description) : JSON.stringify(current.description)
    const finalCategory = category !== undefined ? category : current.category
    const finalPriority = priority !== undefined ? priority : current.priority
    const finalContextPage = context_page !== undefined ? (context_page || null) : current.context_page
    const finalContextSection = context_section !== undefined ? (context_section || null) : current.context_section
    const finalIsActive = is_active !== undefined ? is_active : current.is_active
    const finalConditions = conditions !== undefined 
      ? (conditions ? JSON.stringify(conditions) : null)
      : (current.conditions ? (typeof current.conditions === 'string' ? current.conditions : JSON.stringify(current.conditions)) : null)

    const result = finalConditions
      ? await sql`
          UPDATE assistant_tips 
          SET 
            title = ${finalTitle}::jsonb,
            description = ${finalDescription}::jsonb,
            category = ${finalCategory},
            priority = ${finalPriority},
            context_page = ${finalContextPage},
            context_section = ${finalContextSection},
            is_active = ${finalIsActive},
            conditions = ${finalConditions}::jsonb,
            updated_at = NOW()
          WHERE id = ${params.id}
          RETURNING *
        `
      : await sql`
          UPDATE assistant_tips 
          SET 
            title = ${finalTitle}::jsonb,
            description = ${finalDescription}::jsonb,
            category = ${finalCategory},
            priority = ${finalPriority},
            context_page = ${finalContextPage},
            context_section = ${finalContextSection},
            is_active = ${finalIsActive},
            conditions = NULL,
            updated_at = NOW()
          WHERE id = ${params.id}
          RETURNING *
        `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 })
    }

    // Parse JSONB fields if they come as strings
    const parsedTip = result[0]
    parsedTip.title = typeof parsedTip.title === 'string' ? JSON.parse(parsedTip.title) : parsedTip.title
    parsedTip.description = typeof parsedTip.description === 'string' ? JSON.parse(parsedTip.description) : parsedTip.description

    return NextResponse.json(parsedTip)
  } catch (error: any) {
    console.error('Error updating tip:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

// DELETE - Delete tip (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const result = await sql`
      DELETE FROM assistant_tips WHERE id = ${params.id} RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error('Error deleting tip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

