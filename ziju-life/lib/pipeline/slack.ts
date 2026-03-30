import { sql } from '../database'

export async function sendDailyBrief(): Promise<void> {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
  if (!SLACK_WEBHOOK_URL) {
    throw new Error('SLACK_WEBHOOK_URL is not configured')
  }

  // Count today's processed articles
  const countResult = await sql`
    SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE b.relevance_score >= 7)::int as high_relevance
    FROM pipeline_briefs b
    WHERE b.processed_at > NOW() - INTERVAL '24 hours'
  `

  const total = countResult[0]?.total || 0
  const highRelevance = countResult[0]?.high_relevance || 0
  const adminUrl = 'https://ziju.life/admin/pipeline'

  const text = total === 0
    ? '📬 žiju life pipeline — Dnes žádné nové články ke zpracování.'
    : `📬 žiju life pipeline\n✅ ${total} článků zpracováno · ${highRelevance} s relevance 7+\n→ <${adminUrl}|Otevřít v adminu>`

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Slack webhook failed: ${response.status} — ${body}`)
  }
}
