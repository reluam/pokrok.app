import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/cesta-db'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Initialize Resend only when API key is available
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

// Ensure feedback table exists
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('feedback', 'bug')),
        feedback TEXT NOT NULL,
        include_logs BOOLEAN DEFAULT FALSE,
        logs JSONB,
        user_agent TEXT,
        url TEXT,
        viewport JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC)
    `
  } catch (error: any) {
    // Table might already exist, that's okay
    if (!error.message?.includes('already exists')) {
      console.error('Error creating feedback table:', error)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTableExists()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'feedback' | 'bug' | null (all)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let feedbacks
    let totalResult

    if (type && (type === 'feedback' || type === 'bug')) {
      feedbacks = await sql`
        SELECT 
          f.*,
          u.email as user_email,
          u.name as user_name
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        WHERE f.type = ${type}
        ORDER BY f.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
      totalResult = await sql`SELECT COUNT(*) as count FROM feedback WHERE type = ${type}`
    } else {
      feedbacks = await sql`
        SELECT 
          f.*,
          u.email as user_email,
          u.name as user_name
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
      totalResult = await sql`SELECT COUNT(*) as count FROM feedback`
    }

    const total = parseInt(totalResult[0]?.count || '0')

    return NextResponse.json({
      feedbacks,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedbacks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure table exists
    await ensureTableExists()

    const body = await request.json()
    const { feedback, type, includeLogs, logs, userAgent, url, timestamp, viewport } = body

    // Validate required fields
    if (!feedback || !type) {
      return NextResponse.json(
        { error: 'Feedback and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (type !== 'feedback' && type !== 'bug') {
      return NextResponse.json(
        { error: 'Type must be either "feedback" or "bug"' },
        { status: 400 }
      )
    }

    // Try to get user (optional - feedback can be anonymous)
    let userId: string | null = null
    try {
      const { userId: clerkUserId } = await auth()
      if (clerkUserId) {
        const dbUser = await getUserByClerkId(clerkUserId)
        if (dbUser) {
          userId = dbUser.id
        }
      }
    } catch (error) {
      // User not authenticated - that's okay, feedback can be anonymous
      console.log('Anonymous feedback submitted')
    }

    // Save to database
    const result = await sql`
      INSERT INTO feedback (
        user_id,
        type,
        feedback,
        include_logs,
        logs,
        user_agent,
        url,
        viewport,
        created_at
      ) VALUES (
        ${userId},
        ${type},
        ${feedback},
        ${includeLogs || false},
        ${includeLogs && logs ? JSON.stringify(logs) : null}::jsonb,
        ${userAgent || null},
        ${url || null},
        ${viewport ? JSON.stringify(viewport) : null}::jsonb,
        ${timestamp ? new Date(timestamp) : new Date()}
      )
      RETURNING id
    `

    const feedbackId = result[0]?.id

    console.log(`Feedback saved to database with ID: ${feedbackId}`)

    // Send email notification via Resend
    try {
      const fromEmail = process.env.FROM_MAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      const toEmail = process.env.TO_MAIL || process.env.RESEND_TO_EMAIL || 'matej.mauler@gmail.com'
      
      // Get base URL from request or environment
      const requestUrl = new URL(request.url)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        `${requestUrl.protocol}//${requestUrl.host}`
      const locale = process.env.NEXT_PUBLIC_LOCALE || 'cs'
      const feedbackUrl = `${baseUrl}/${locale}/planner/admin/feedback/${feedbackId}`

      const resend = getResend()
      
      const typeLabel = type === 'bug' ? 'Chyba' : 'Feedback'
      
      await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: `Pokrok - ${typeLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E8871E; border-bottom: 2px solid #E8871E; padding-bottom: 10px;">
              Nový ${typeLabel.toLowerCase()}
            </h2>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Typ:</strong> ${typeLabel}</p>
              ${userId ? `<p style="margin: 0 0 10px 0;"><strong>Uživatel ID:</strong> ${userId}</p>` : '<p style="margin: 0 0 10px 0;"><strong>Uživatel:</strong> Anonymní</p>'}
              ${url ? `<p style="margin: 0 0 10px 0;"><strong>URL:</strong> <a href="${url}" style="color: #E8871E;">${url}</a></p>` : ''}
              <p style="margin: 10px 0 0 0;"><strong>Zpráva:</strong></p>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap; line-height: 1.6;">
                ${feedback.replace(/\n/g, '<br>')}
              </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #E8871E; border-radius: 8px; text-align: center;">
              <a href="${feedbackUrl}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
                Zobrazit detail v adminu →
              </a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
              Tento email byl automaticky odeslán při přijetí nového ${typeLabel.toLowerCase()}u.
            </p>
          </div>
        `,
        text: `
Nový ${typeLabel.toLowerCase()}

Typ: ${typeLabel}
${userId ? `Uživatel ID: ${userId}` : 'Uživatel: Anonymní'}
${url ? `URL: ${url}` : ''}

Zpráva:
${feedback}

Zobrazit detail: ${feedbackUrl}

---
Tento email byl automaticky odeslán při přijetí nového ${typeLabel.toLowerCase()}u.
        `.trim(),
      })
    } catch (emailError) {
      // Don't fail the request if email fails - feedback is already saved
      console.error('Error sending feedback email notification:', emailError)
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Feedback received successfully',
        id: feedbackId
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}
