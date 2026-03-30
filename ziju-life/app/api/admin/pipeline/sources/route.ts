import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { sql } from '@/lib/database'

export async function GET() {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sources = await sql`
      SELECT
        s.*,
        COUNT(a.id)::int as article_count,
        MAX(a.published_at) as last_article_at,
        ROUND(AVG(b.relevance_score), 1) as avg_relevance
      FROM pipeline_sources s
      LEFT JOIN pipeline_articles a ON s.id = a.source_id
      LEFT JOIN pipeline_briefs b ON a.id = b.article_id
      GROUP BY s.id
      ORDER BY s.category, s.name
    `

    return NextResponse.json({ sources })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sources', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, url, type, category, priority } = await request.json()

    if (!name || !url || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO pipeline_sources (name, url, type, category, priority)
      VALUES (${name}, ${url}, ${type || 'rss'}, ${category}, ${priority || 'medium'})
      RETURNING *
    `

    return NextResponse.json({ source: result[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add source', details: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, is_active, priority, category } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing source id' }, { status: 400 })
    }

    await sql`
      UPDATE pipeline_sources SET
        is_active = COALESCE(${is_active ?? null}, is_active),
        priority = COALESCE(${priority || null}, priority),
        category = COALESCE(${category || null}, category)
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed', details: String(error) }, { status: 500 })
  }
}
