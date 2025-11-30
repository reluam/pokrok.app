import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { getUserByClerkId } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Support both query param and auth-based userId
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    const targetUserId = userIdParam || dbUser.id

    // Verify ownership if userId param is provided
    if (userIdParam && userIdParam !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const areas = await sql`
      SELECT * FROM areas 
      WHERE user_id = ${targetUserId}
      ORDER BY "order" ASC, created_at ASC
    `
    
    return NextResponse.json({ areas })
  } catch (error: any) {
    console.error('Error fetching areas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, color, icon, order } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    
    // Get max order if not provided
    let areaOrder = order
    if (areaOrder === undefined || areaOrder === null) {
      const maxOrderResult = await sql`
        SELECT COALESCE(MAX("order"), 0) as max_order 
        FROM areas 
        WHERE user_id = ${dbUser.id}
      `
      areaOrder = (maxOrderResult[0]?.max_order || 0) + 1
    }

    const area = await sql`
      INSERT INTO areas (
        id, user_id, name, description, color, icon, "order"
      ) VALUES (
        ${id}, ${dbUser.id}, ${name}, ${description || null}, 
        ${color || '#3B82F6'}, ${icon || 'Target'}, ${areaOrder}
      ) RETURNING *
    `
    
    return NextResponse.json({ area: area[0] })
  } catch (error: any) {
    console.error('Error creating area:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, name, description, color, icon, order } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingArea = await sql`
      SELECT user_id FROM areas WHERE id = ${id}
    `
    
    if (existingArea.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    if (existingArea[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const area = await sql`
      UPDATE areas 
      SET 
        name = ${name || ''},
        description = ${description !== undefined ? description : null},
        color = ${color || '#3B82F6'},
        icon = ${icon || 'Target'},
        "order" = ${order !== undefined ? order : 0},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    
    if (area.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    return NextResponse.json({ area: area[0] })
  } catch (error: any) {
    console.error('Error updating area:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingArea = await sql`
      SELECT user_id FROM areas WHERE id = ${id}
    `
    
    if (existingArea.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    if (existingArea[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const result = await sql`
      DELETE FROM areas 
      WHERE id = ${id}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting area:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

