import { NextRequest, NextResponse } from 'next/server'
import { fetchAllSources } from '@/lib/pipeline/fetcher'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await fetchAllSources()
    const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0)
    const errors = results.filter((r) => r.errors.length > 0)

    return NextResponse.json({
      success: true,
      totalNew,
      sourcesWithErrors: errors.length,
      details: results,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Fetch failed', details: String(error) },
      { status: 500 }
    )
  }
}
