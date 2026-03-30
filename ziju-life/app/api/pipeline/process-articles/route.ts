import { NextRequest, NextResponse } from 'next/server'
import { processUnprocessedArticles } from '@/lib/pipeline/processor'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { processed, remaining } = await processUnprocessedArticles(3)

    return NextResponse.json({
      success: true,
      processed,
      remaining,
      hint: remaining > 0 ? 'Call this endpoint again to process more articles.' : 'All articles processed.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Processing failed', details: String(error) },
      { status: 500 }
    )
  }
}
