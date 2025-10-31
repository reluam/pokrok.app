import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const body = await request.json()
    const { enabled, trigger_time, completed_at } = body

    // Build update object
    const updateData: any = {
      updated_at: new Date()
    }
    
    if (enabled !== undefined) {
      updateData.enabled = enabled
    }
    if (trigger_time !== undefined) {
      updateData.trigger_time = trigger_time
    }
    if (completed_at !== undefined) {
      updateData.completed_at = completed_at ? new Date() : null
    }

    // Perform update
    const workflow = await sql`
      UPDATE workflows 
      SET 
        ${updateData.enabled !== undefined ? sql`enabled = ${updateData.enabled}` : sql`enabled = enabled`},
        ${updateData.trigger_time !== undefined ? sql`trigger_time = ${updateData.trigger_time}` : sql`trigger_time = trigger_time`},
        ${updateData.completed_at !== undefined ? sql`completed_at = ${updateData.completed_at}` : sql`completed_at = completed_at`},
        updated_at = ${updateData.updated_at}
      WHERE id = ${workflowId}
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

