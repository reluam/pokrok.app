import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// GET - Get workflow responses for a date or date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    try {
      // Ensure table exists
      await sql`
        CREATE TABLE IF NOT EXISTS workflow_responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          workflow_id UUID NOT NULL,
          workflow_type TEXT NOT NULL,
          date DATE NOT NULL,
          responses JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      let responses
      if (date) {
        // Get responses for specific date
        responses = await sql`
          SELECT * FROM workflow_responses 
          WHERE user_id = ${userId} AND date = ${date}
          ORDER BY created_at DESC
        `
      } else if (startDate && endDate) {
        // Get responses for date range
        responses = await sql`
          SELECT * FROM workflow_responses 
          WHERE user_id = ${userId} 
            AND date >= ${startDate} 
            AND date <= ${endDate}
          ORDER BY date DESC, created_at DESC
        `
      } else {
        return NextResponse.json({ error: 'date or startDate/endDate is required' }, { status: 400 })
      }
      
      return NextResponse.json(responses)
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      throw error
    }
  } catch (error) {
    console.error('Error fetching workflow responses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save workflow response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workflowId, workflowType, date, responses } = body
    
    if (!userId || !workflowId || !workflowType || !date || !responses) {
      return NextResponse.json({ 
        error: 'userId, workflowId, workflowType, date, and responses are required' 
      }, { status: 400 })
    }

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        workflow_id UUID NOT NULL,
        workflow_type TEXT NOT NULL,
        date DATE NOT NULL,
        responses JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, workflow_id, date)
      )
    `

    // Upsert response
    const id = crypto.randomUUID()
    const result = await sql`
      INSERT INTO workflow_responses (
        id, user_id, workflow_id, workflow_type, date, responses
      ) VALUES (
        ${id}, ${userId}, ${workflowId}, ${workflowType}, ${date}, ${JSON.stringify(responses)}
      )
      ON CONFLICT (user_id, workflow_id, date) 
      DO UPDATE SET 
        responses = ${JSON.stringify(responses)},
        updated_at = NOW()
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error saving workflow response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

