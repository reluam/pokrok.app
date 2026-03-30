import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { sql } from '@/lib/database'
import { createCuratedPost } from '@/lib/curated-posts-db'

export async function POST(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { briefId, curatorNote } = await request.json()
    if (!briefId) return NextResponse.json({ error: 'Missing briefId' }, { status: 400 })

    // Fetch the brief with article info
    const briefs = await sql`
      SELECT b.*, a.title, a.url, s.name as source_name
      FROM pipeline_briefs b
      JOIN pipeline_articles a ON b.article_id = a.id
      JOIN pipeline_sources s ON a.source_id = s.id
      WHERE b.id = ${briefId}
    `

    if (briefs.length === 0) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
    }

    const brief = briefs[0]

    // Build the tip body
    const body = `${brief.summary_cs}\n\n🔗 [${brief.source_name}: ${brief.title}](${brief.url})`

    const post = await createCuratedPost({
      type: 'tip',
      title: brief.title,
      body_markdown: body,
      pipeline_brief_ids: [briefId],
      curator_note: curatorNote || null,
      categories: brief.categories || [],
      tags: brief.tags || [],
      status: 'published',
    })

    // Mark the brief as published
    await sql`
      UPDATE pipeline_briefs SET pipeline_status = 'published', published_at = NOW()
      WHERE id = ${briefId}
    `

    return NextResponse.json({ success: true, post })
  } catch (error) {
    return NextResponse.json({ error: 'Quick share failed', details: String(error) }, { status: 500 })
  }
}
