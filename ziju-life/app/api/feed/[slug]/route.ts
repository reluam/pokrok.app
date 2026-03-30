import { NextRequest, NextResponse } from 'next/server'
import { getCuratedPost } from '@/lib/curated-posts-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const post = await getCuratedPost(slug)

    if (!post || post.status !== 'published') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 })
  }
}
