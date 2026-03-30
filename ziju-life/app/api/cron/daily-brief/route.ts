import { NextRequest, NextResponse } from 'next/server'
import { fetchAllSources } from '@/lib/pipeline/fetcher'
import { processUnprocessedArticles } from '@/lib/pipeline/processor'
import { sendDailyBrief } from '@/lib/pipeline/slack'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Step 1: Fetch new articles from all sources
    console.log('[daily-brief] Step 1: Fetching sources...')
    const fetchResults = await fetchAllSources()
    const totalNew = fetchResults.reduce((sum, r) => sum + r.newArticles, 0)
    const errors = fetchResults.filter((r) => r.errors.length > 0)
    console.log(`[daily-brief] Fetched ${totalNew} new articles, ${errors.length} sources had errors`)

    // Step 2: Process new articles via Claude API
    console.log('[daily-brief] Step 2: Processing with Claude API...')
    const processedCount = await processUnprocessedArticles()
    console.log(`[daily-brief] Processed ${processedCount} articles`)

    // Step 3: Send daily brief to Slack
    console.log('[daily-brief] Step 3: Sending daily brief to Slack...')
    await sendDailyBrief()
    console.log('[daily-brief] Daily brief sent!')

    return NextResponse.json({
      success: true,
      fetched: totalNew,
      processed: processedCount,
      fetchDetails: fetchResults,
    })
  } catch (error) {
    console.error('[daily-brief] Failed:', error)
    return NextResponse.json(
      { error: 'Daily brief failed', details: String(error) },
      { status: 500 }
    )
  }
}
