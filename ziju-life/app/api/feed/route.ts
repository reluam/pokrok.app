import { NextRequest, NextResponse } from 'next/server'
import { listCuratedPosts } from '@/lib/curated-posts-db'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const type = params.get('type') || undefined
  const page = parseInt(params.get('page') || '1')
  const limit = parseInt(params.get('limit') || '20')

  try {
    const result = await listCuratedPosts({ type, status: 'published', page, limit })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch feed', details: String(error) }, { status: 500 })
  }
}
