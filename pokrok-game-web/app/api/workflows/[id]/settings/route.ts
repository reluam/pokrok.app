import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { id: workflowId } = await params
    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví workflow
    const existingWorkflow = await sql`
      SELECT user_id FROM workflows WHERE id = ${workflowId}
    `
    
    if (existingWorkflow.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    
    if (existingWorkflow[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update workflow settings
    const updated = await sql`
      UPDATE workflows 
      SET settings = ${JSON.stringify(settings)}::jsonb, updated_at = NOW()
      WHERE id = ${workflowId} AND user_id = ${dbUser.id}
      RETURNING *
    `
    
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    
    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Error updating workflow settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

