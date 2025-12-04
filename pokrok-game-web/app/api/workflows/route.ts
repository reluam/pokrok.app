import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Try to get workflows, handle case where table doesn't exist yet
    try {
      const workflows = await sql`
        SELECT * FROM workflows 
        WHERE user_id = ${targetUserId}
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
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { userId, type, name, description, trigger_time, enabled } = body
    
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        ${id}, ${targetUserId}, ${type}, ${name}, ${description || null}, 
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
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { id, enabled, trigger_time, completed_at } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví workflow
    const existingWorkflow = await sql`
      SELECT user_id FROM workflows WHERE id = ${id}
    `
    
    if (existingWorkflow.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    
    if (existingWorkflow[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: any = {}
    if (enabled !== undefined) updates.enabled = enabled
    if (trigger_time !== undefined) updates.trigger_time = trigger_time
    if (completed_at !== undefined) updates.completed_at = completed_at ? new Date() : null
    updates.updated_at = new Date()

    // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
    const workflow = await sql`
      UPDATE workflows 
      SET 
        enabled = COALESCE(${updates.enabled}, enabled),
        trigger_time = COALESCE(${updates.trigger_time}, trigger_time),
        completed_at = ${updates.completed_at},
        updated_at = ${updates.updated_at}
      WHERE id = ${id} AND user_id = ${dbUser.id}
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

