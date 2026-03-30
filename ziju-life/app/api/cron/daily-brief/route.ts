import { NextRequest, NextResponse } from 'next/server'
import { sendDailyBrief } from '@/lib/pipeline/slack'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await sendDailyBrief()

    return NextResponse.json({ success: true, message: 'Daily brief sent to Slack' })
  } catch (error) {
    console.error('[daily-brief] Failed:', error)
    return NextResponse.json(
      { error: 'Daily brief failed', details: String(error) },
      { status: 500 }
    )
  }
}
