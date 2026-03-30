import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { sql } from '@/lib/database'

export async function GET() {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [categories, daily, topTags, pipeline, sources] = await Promise.all([
      // Category breakdown
      sql`
        SELECT
          b.primary_category,
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE b.pipeline_status = 'inbox')::int as inbox,
          COUNT(*) FILTER (WHERE b.pipeline_status = 'saved')::int as saved,
          COUNT(*) FILTER (WHERE b.pipeline_status = 'in_progress')::int as in_progress,
          COUNT(*) FILTER (WHERE b.pipeline_status = 'published')::int as published,
          ROUND(AVG(b.relevance_score), 1) as avg_relevance
        FROM pipeline_briefs b
        GROUP BY b.primary_category
        ORDER BY total DESC
      `,

      // Daily volume (last 30 days)
      sql`
        SELECT
          DATE(a.published_at) as date,
          COUNT(*)::int as article_count,
          ROUND(AVG(b.relevance_score), 1) as avg_relevance
        FROM pipeline_briefs b
        JOIN pipeline_articles a ON b.article_id = a.id
        WHERE a.published_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(a.published_at)
        ORDER BY date DESC
      `,

      // Top tags (last 30 days)
      sql`
        SELECT tag, COUNT(*)::int as count
        FROM pipeline_briefs b, UNNEST(b.tags) as tag
        WHERE b.processed_at > NOW() - INTERVAL '30 days'
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 30
      `,

      // Pipeline status counts
      sql`
        SELECT pipeline_status, COUNT(*)::int as count
        FROM pipeline_briefs
        GROUP BY pipeline_status
      `,

      // Source performance (last 30 days)
      sql`
        SELECT
          s.name,
          s.category,
          COUNT(*)::int as article_count,
          ROUND(AVG(b.relevance_score), 1) as avg_relevance,
          COUNT(*) FILTER (WHERE b.relevance_score >= 7)::int as high_relevance_count
        FROM pipeline_sources s
        JOIN pipeline_articles a ON s.id = a.source_id
        JOIN pipeline_briefs b ON a.id = b.article_id
        WHERE a.published_at > NOW() - INTERVAL '30 days'
        GROUP BY s.id, s.name, s.category
        ORDER BY avg_relevance DESC
      `,
    ])

    return NextResponse.json({ categories, daily, topTags, pipeline, sources })
  } catch (error) {
    return NextResponse.json({ error: 'Stats failed', details: String(error) }, { status: 500 })
  }
}
