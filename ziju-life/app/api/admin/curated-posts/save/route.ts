import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { createCuratedPost } from '@/lib/curated-posts-db'
import { sql } from '@/lib/database'

export async function POST(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const post = await createCuratedPost({
      type: data.type || 'digest',
      title: data.title,
      subtitle: data.subtitle,
      body_markdown: data.body_markdown,
      video_script: data.video_script,
      pipeline_brief_ids: data.pipeline_brief_ids,
      categories: data.categories,
      tags: data.tags,
      status: data.status || 'draft',
      week_number: data.week_number,
      week_year: data.week_year,
    })

    // If publishing, mark source briefs as published
    if (data.status === 'published' && data.pipeline_brief_ids?.length > 0) {
      await sql`
        UPDATE pipeline_briefs
        SET pipeline_status = 'published', published_at = NOW()
        WHERE id = ANY(${data.pipeline_brief_ids})
      `
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    return NextResponse.json({ error: 'Save failed', details: String(error) }, { status: 500 })
  }
}
