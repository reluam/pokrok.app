import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Ensure view_configurations table exists
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS view_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        workflow_key TEXT NOT NULL,
        enabled BOOLEAN DEFAULT false,
        settings JSONB, -- { enabledViewTypes: ['day', 'week'], workflowSettings: {...} }
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, workflow_key)
      )
    `
  } catch (error: any) {
    // Table might already exist, that's okay
    if (!error.message?.includes('already exists')) {
      console.error('Error creating view_configurations table:', error)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTableExists()
    
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Load ALL configurations (not just enabled) for settings page
    // Frontend can filter if needed
    const configurations = await sql`
      SELECT * FROM view_configurations 
      WHERE user_id = ${dbUser.id}
      ORDER BY order_index ASC, created_at ASC
    `

    return NextResponse.json(configurations)
  } catch (error: any) {
    console.error('Error fetching view configurations:', error)
    // If table doesn't exist, return empty array
    if (error.message?.includes('does not exist')) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTableExists()
    
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { workflow_key, enabled = false, settings = null } = body

    if (!workflow_key) {
      return NextResponse.json({ error: 'workflow_key is required' }, { status: 400 })
    }

    // Check if configuration already exists
    const existing = await sql`
      SELECT id FROM view_configurations 
      WHERE user_id = ${dbUser.id} AND workflow_key = ${workflow_key}
      LIMIT 1
    `

    let configuration
    if (existing.length > 0) {
      // Update existing
      const settingsJson = settings ? JSON.stringify(settings) : null
      
      if (settingsJson) {
        configuration = await sql`
          UPDATE view_configurations 
          SET enabled = ${enabled}, 
              settings = ${settingsJson}::jsonb,
              updated_at = NOW()
          WHERE user_id = ${dbUser.id} AND workflow_key = ${workflow_key}
          RETURNING *
        `
      } else {
        configuration = await sql`
          UPDATE view_configurations 
          SET enabled = ${enabled}, 
              settings = NULL,
              updated_at = NOW()
          WHERE user_id = ${dbUser.id} AND workflow_key = ${workflow_key}
          RETURNING *
        `
      }
    } else {
      // Create new
      const settingsJson = settings ? JSON.stringify(settings) : null
      
      // Get max order_index
      const maxOrder = await sql`
        SELECT COALESCE(MAX(order_index), 0) as max_order 
        FROM view_configurations 
        WHERE user_id = ${dbUser.id}
      `
      const nextOrder = parseInt(maxOrder[0]?.max_order || '0') + 1

      if (settingsJson) {
        configuration = await sql`
          INSERT INTO view_configurations (user_id, workflow_key, enabled, settings, order_index)
          VALUES (${dbUser.id}, ${workflow_key}, ${enabled}, 
                  ${settingsJson}::jsonb,
                  ${nextOrder})
          RETURNING *
        `
      } else {
        configuration = await sql`
          INSERT INTO view_configurations (user_id, workflow_key, enabled, settings, order_index)
          VALUES (${dbUser.id}, ${workflow_key}, ${enabled}, 
                  NULL,
                  ${nextOrder})
          RETURNING *
        `
      }
    }

    return NextResponse.json(configuration[0])
  } catch (error: any) {
    console.error('Error creating/updating view configuration:', error)
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

