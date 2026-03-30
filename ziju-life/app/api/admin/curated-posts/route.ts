import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { listCuratedPosts, updateCuratedPost, deleteCuratedPost } from '@/lib/curated-posts-db'

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const type = params.get('type') || undefined
  const status = params.get('status') || 'published'
  const page = parseInt(params.get('page') || '1')
  const limit = parseInt(params.get('limit') || '20')

  try {
    const result = await listCuratedPosts({ type, status, page, limit })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, ...data } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await updateCuratedPost(id, data)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteCuratedPost(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed', details: String(error) }, { status: 500 })
  }
}
