import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { sql } from '@/lib/database'

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const category = params.get('category')
  const minRelevance = parseInt(params.get('minRelevance') || '1')
  const status = params.get('status')
  const search = params.get('search')
  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')
  const page = parseInt(params.get('page') || '1')
  const limit = Math.min(parseInt(params.get('limit') || '20'), 50)
  const offset = (page - 1) * limit

  try {
    // Build the query with neon tagged templates
    // We use a single query with conditional WHERE clauses
    const articles = await sql`
      SELECT
        b.id as brief_id,
        b.summary_cs,
        b.relevance_score,
        b.primary_category,
        b.categories,
        b.content_angle,
        b.key_insight,
        b.tags,
        b.pipeline_status,
        b.pipeline_notes,
        b.is_used,
        b.processed_at,
        b.saved_at,
        b.published_at as brief_published_at,
        b.published_url,
        a.id as article_id,
        a.title,
        a.url,
        a.published_at,
        a.content_type,
        s.name as source_name,
        s.category as source_category
      FROM pipeline_briefs b
      JOIN pipeline_articles a ON b.article_id = a.id
      JOIN pipeline_sources s ON a.source_id = s.id
      WHERE b.relevance_score >= ${minRelevance}
        AND (${category}::text IS NULL OR b.primary_category = ${category})
        AND b.pipeline_status != 'archived'
        AND (${status}::text IS NULL OR b.pipeline_status = ${status})
        AND (${search}::text IS NULL OR (
          b.summary_cs ILIKE ${'%' + (search || '') + '%'}
          OR a.title ILIKE ${'%' + (search || '') + '%'}
          OR b.key_insight ILIKE ${'%' + (search || '') + '%'}
        ))
        AND (${dateFrom}::timestamptz IS NULL OR a.published_at >= ${dateFrom}::timestamptz)
        AND (${dateTo}::timestamptz IS NULL OR a.published_at <= ${dateTo}::timestamptz)
      ORDER BY a.published_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*)::int as total
      FROM pipeline_briefs b
      JOIN pipeline_articles a ON b.article_id = a.id
      JOIN pipeline_sources s ON a.source_id = s.id
      WHERE b.relevance_score >= ${minRelevance}
        AND (${category}::text IS NULL OR b.primary_category = ${category})
        AND b.pipeline_status != 'archived'
        AND (${status}::text IS NULL OR b.pipeline_status = ${status})
        AND (${search}::text IS NULL OR (
          b.summary_cs ILIKE ${'%' + (search || '') + '%'}
          OR a.title ILIKE ${'%' + (search || '') + '%'}
          OR b.key_insight ILIKE ${'%' + (search || '') + '%'}
        ))
        AND (${dateFrom}::timestamptz IS NULL OR a.published_at >= ${dateFrom}::timestamptz)
        AND (${dateTo}::timestamptz IS NULL OR a.published_at <= ${dateTo}::timestamptz)
    `

    const total = countResult[0]?.total || 0

    return NextResponse.json({
      articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { briefId } = await request.json()
    if (!briefId) {
      return NextResponse.json({ error: 'Missing briefId' }, { status: 400 })
    }

    // Get article_id before deleting brief
    const brief = await sql`SELECT article_id FROM pipeline_briefs WHERE id = ${briefId}`
    if (brief.length === 0) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
    }

    const articleId = brief[0].article_id

    // Delete the brief first (FK dependency)
    await sql`DELETE FROM pipeline_briefs WHERE id = ${briefId}`
    // Delete the article if no other briefs reference it
    await sql`
      DELETE FROM pipeline_articles WHERE id = ${articleId}
        AND NOT EXISTS (SELECT 1 FROM pipeline_briefs WHERE article_id = ${articleId})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed', details: String(error) }, { status: 500 })
  }
}
