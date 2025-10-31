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

    // Try to get workflows, handle case where table doesn't exist yet
    try {
      const workflows = await sql`
        SELECT * FROM workflows 
        WHERE user_id = ${userId}
        ORDER BY created_at ASC
      `
      return NextResponse.json(workflows)
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      throw error
    }
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, name, description, trigger_time, enabled } = body
    
    if (!userId || !type) {
      return NextResponse.json({ error: 'User ID and type are required' }, { status: 400 })
    }

    // Ensure workflows table exists
    await sql`
      CREATE TABLE IF NOT EXISTS workflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        trigger_time TEXT,
        enabled BOOLEAN DEFAULT true,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    const id = crypto.randomUUID()
    const workflow = await sql`
      INSERT INTO workflows (
        id, user_id, type, name, description, trigger_time, enabled
      ) VALUES (
        ${id}, ${userId}, ${type}, ${name}, ${description || null}, 
        ${trigger_time || '18:00'}, ${enabled !== false}
      ) RETURNING *
    `
    return NextResponse.json(workflow[0])
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, enabled, trigger_time, completed_at } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    const updates: any = {}
    if (enabled !== undefined) updates.enabled = enabled
    if (trigger_time !== undefined) updates.trigger_time = trigger_time
    if (completed_at !== undefined) updates.completed_at = completed_at ? new Date() : null
    updates.updated_at = new Date()

    const workflow = await sql`
      UPDATE workflows 
      SET 
        enabled = COALESCE(${updates.enabled}, enabled),
        trigger_time = COALESCE(${updates.trigger_time}, trigger_time),
        completed_at = ${updates.completed_at},
        updated_at = ${updates.updated_at}
      WHERE id = ${id}
      RETURNING *
    `
    
    if (workflow.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    
    return NextResponse.json(workflow[0])
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

