import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const areas = await sql`
      SELECT * FROM areas 
      WHERE user_id = ${userId}
      ORDER BY "order" ASC
    `
    return NextResponse.json(areas)
  } catch (error) {
    console.error('Error fetching areas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, color, icon, order } = body
    
    if (!userId || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const area = await sql`
      INSERT INTO areas (
        id, user_id, name, description, color, icon, "order"
      ) VALUES (
        ${id}, ${userId}, ${name}, ${description || null}, 
        ${color || '#3B82F6'}, ${icon || '📁'}, ${order || 0}
      ) RETURNING *
    `
    return NextResponse.json(area[0])
  } catch (error) {
    console.error('Error creating area:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, color, icon, order } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 })
    }

    const area = await sql`
      UPDATE areas 
      SET 
        name = ${name || ''},
        description = ${description || null},
        color = ${color || '#3B82F6'},
        icon = ${icon || '📁'},
        "order" = ${order || 0},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    
    if (area.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    return NextResponse.json(area[0])
  } catch (error) {
    console.error('Error updating area:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM areas 
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Area deleted successfully' })
  } catch (error) {
    console.error('Error deleting area:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
