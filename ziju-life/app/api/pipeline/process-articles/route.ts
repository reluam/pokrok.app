import { NextRequest, NextResponse } from 'next/server'
import { processUnprocessedArticles } from '@/lib/pipeline/processor'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const processedCount = await processUnprocessedArticles()

    return NextResponse.json({
      success: true,
      processed: processedCount,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Processing failed', details: String(error) },
      { status: 500 }
    )
  }
}
