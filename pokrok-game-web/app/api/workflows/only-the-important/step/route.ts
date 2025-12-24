import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Ensure important_steps_planning table exists
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS important_steps_planning (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        step_id TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('important', 'other', 'backlog')),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, date, step_id)
      )
    `
  } catch (error: any) {
    // Table might already exist, that's okay
    if (!error.message?.includes('already exists')) {
      console.error('Error creating important_steps_planning table:', error)
    }
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTableExists()
    
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const step_id = searchParams.get('step_id')
    const date = searchParams.get('date')

    if (!step_id) {
      return NextResponse.json({ error: 'step_id is required' }, { status: 400 })
    }

    // Verify step ownership
    const step = await sql`
      SELECT user_id FROM daily_steps 
      WHERE id = ${step_id} AND user_id = ${dbUser.id}
      LIMIT 1
    `

    if (step.length === 0) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Remove from planning if date is provided
    if (date) {
      await sql`
        DELETE FROM important_steps_planning 
        WHERE user_id = ${dbUser.id} AND step_id = ${step_id} AND date = ${date}
      `
    } else {
      // Remove from all planning entries for this step
      await sql`
        DELETE FROM important_steps_planning 
        WHERE user_id = ${dbUser.id} AND step_id = ${step_id}
      `
    }

    // Delete the step itself
    await sql`
      DELETE FROM daily_steps 
      WHERE user_id = ${dbUser.id} AND id = ${step_id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

