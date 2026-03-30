import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { fetchAllSources } from '@/lib/pipeline/fetcher'
import { processUnprocessedArticles } from '@/lib/pipeline/processor'
import { sendDailyBrief } from '@/lib/pipeline/slack'

export async function POST(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { step } = await request.json()

    if (step === 'fetch') {
      const results = await fetchAllSources()
      const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0)
      return NextResponse.json({ success: true, step: 'fetch', totalNew, details: results })
    }

    if (step === 'process') {
      const { processed, remaining } = await processUnprocessedArticles(3)
      return NextResponse.json({ success: true, step: 'process', processed, remaining })
    }

    if (step === 'brief') {
      await sendDailyBrief()
      return NextResponse.json({ success: true, step: 'brief' })
    }

    return NextResponse.json({ error: 'Invalid step. Use: fetch, process, brief' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Trigger failed', details: String(error) }, { status: 500 })
  }
}
