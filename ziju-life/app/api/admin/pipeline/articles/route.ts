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
        AND (${status}::text IS NULL OR b.pipeline_status = ${status})
        AND (${status}::text IS NOT NULL OR b.pipeline_status != 'archived')
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
        AND (${status}::text IS NULL OR b.pipeline_status = ${status})
        AND (${status}::text IS NOT NULL OR b.pipeline_status != 'archived')
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
