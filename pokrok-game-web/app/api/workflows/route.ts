import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers'
import { clerkClient } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Helper function to check if user has premium subscription
// Uses Clerk's billing metadata stored in publicMetadata
async function hasPremiumSubscription(clerkUserId: string): Promise<boolean> {
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(clerkUserId)
    
    // Check if user has premium plan using Clerk's billing metadata
    // Clerk stores subscription info in publicMetadata
    // For B2C billing, plan is stored as 'premium' or 'free_user'
    const plan = user.publicMetadata?.plan as string | undefined
    
    return plan === 'premium'
  } catch (error) {
    console.error('Error checking premium subscription:', error)
    // On error, assume no premium to be safe
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser, clerkUserId } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user has premium subscription
    const hasPremium = await hasPremiumSubscription(clerkUserId)

    // Try to get workflows, handle case where table doesn't exist yet
    try {
      let workflows = await sql`
        SELECT * FROM workflows 
        WHERE user_id = ${targetUserId}
        ORDER BY created_at ASC
      `
      
      // If user doesn't have premium, automatically disable all enabled workflows
      if (!hasPremium && workflows.length > 0) {
        const enabledWorkflows = workflows.filter((w: any) => w.enabled === true)
        if (enabledWorkflows.length > 0) {
          await sql`
            UPDATE workflows 
            SET enabled = false, updated_at = NOW()
            WHERE user_id = ${targetUserId} AND enabled = true
          `
          // Reload workflows from database to get updated values
          workflows = await sql`
            SELECT * FROM workflows 
            WHERE user_id = ${targetUserId}
            ORDER BY created_at ASC
          `
        }
      }
      
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
    try {
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
          settings JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    } catch (error: any) {
      // Table might already exist
      console.error('Error creating workflows table:', error)
    }

    // Always try to add settings column if it doesn't exist (idempotent)
    try {
      await sql`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS settings JSONB`
    } catch (alterError: any) {
      // Column might already exist, that's okay
      if (!alterError.message?.includes('already exists') && !alterError.message?.includes('duplicate column')) {
        console.error('Error adding settings column:', alterError)
      }
    }

    const id = crypto.randomUUID()
    const settingsValue = body.settings ? body.settings : null
    
    // Build the query - Neon SQL supports JSONB via JSON.stringify in parameter
    // Use conditional query to handle NULL vs JSONB properly
    let workflow
    if (settingsValue) {
      const settingsJson = JSON.stringify(settingsValue)
      // Use sql template with explicit cast
      workflow = await sql`
        INSERT INTO workflows (
          id, user_id, type, name, description, trigger_time, enabled, settings
        ) VALUES (
          ${id}, ${targetUserId}, ${type}, ${name}, ${description || null}, 
          ${trigger_time || '18:00'}, ${enabled !== false}, 
          ${settingsJson}::jsonb
        ) RETURNING *
      `
    } else {
      workflow = await sql`
      INSERT INTO workflows (
          id, user_id, type, name, description, trigger_time, enabled, settings
      ) VALUES (
        ${id}, ${targetUserId}, ${type}, ${name}, ${description || null}, 
          ${trigger_time || '18:00'}, ${enabled !== false}, 
          NULL
      ) RETURNING *
    `
    }
    return NextResponse.json(workflow[0])
  } catch (error: any) {
    console.error('Error creating workflow:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
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

