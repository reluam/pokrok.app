import { sql } from '../database'
import { CATEGORY_EMOJI } from './sources'

export async function sendDailyBrief(): Promise<void> {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
  if (!SLACK_WEBHOOK_URL) {
    throw new Error('SLACK_WEBHOOK_URL is not configured')
  }

  const articles = await sql`
    SELECT
      b.article_id,
      b.summary_cs,
      b.relevance_score,
      b.primary_category,
      b.content_angle,
      b.key_insight,
      a.title,
      a.url,
      a.content_type,
      s.name as source_name
    FROM pipeline_briefs b
    JOIN pipeline_articles a ON b.article_id = a.id
    JOIN pipeline_sources s ON a.source_id = s.id
    WHERE b.processed_at > NOW() - INTERVAL '24 hours'
    ORDER BY b.relevance_score DESC
  `

  if (articles.length === 0) {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '📬 žiju life — Denní brief: Dnes žádné nové články ke zpracování.',
      }),
    })
    return
  }

  const topArticles = articles.slice(0, 5)
  const otherArticles = articles.slice(5, 15)

  const today = new Date().toLocaleDateString('cs-CZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // === STATS ===
  const categoryCount: Record<string, number> = {}
  articles.forEach((a) => {
    categoryCount[a.primary_category] = (categoryCount[a.primary_category] || 0) + 1
  })
  const statsLine = Object.entries(categoryCount)
    .map(([cat, count]) => `${CATEGORY_EMOJI[cat] || ''} ${count}`)
    .join(' · ')

  // Build blocks — each top article is its own section to stay under 3000 char limit
  const blocks: unknown[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📬 žiju life — Denní brief', emoji: true },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `${today} · ${articles.length} zpracovaných · ${statsLine}` }],
    },
    { type: 'divider' },
  ]

  // Top 5 — each as its own block
  topArticles.forEach((article, index) => {
    const emoji = CATEGORY_EMOJI[article.primary_category] || '📌'
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${index + 1}. ${emoji} ${article.title}*\n${article.summary_cs}\n💡 _${article.content_angle}_\n🔗 <${article.url}|${article.source_name}> · ${article.relevance_score}/10`,
      },
    })
  })

  // Other interesting — compact list in one block
  if (otherArticles.length > 0) {
    const lines = otherArticles.map((a) => {
      const emoji = CATEGORY_EMOJI[a.primary_category] || '📌'
      return `${emoji} <${a.url}|${a.title}> _(${a.relevance_score}/10)_`
    })

    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          // Slack section text limit is 3000 chars — truncate if needed
          text: `*📋 Další zajímavé*\n${lines.join('\n').substring(0, 2900)}`,
        },
      }
    )
  }

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Slack webhook failed: ${response.status} — ${body}`)
  }

  // Archive daily brief
  await sql`
    INSERT INTO pipeline_daily_briefs (brief_date, top_articles, other_articles)
    VALUES (
      CURRENT_DATE,
      ${topArticles.map((a) => a.article_id)},
      ${otherArticles.map((a) => a.article_id)}
    )
    ON CONFLICT (brief_date) DO UPDATE SET
      top_articles = EXCLUDED.top_articles,
      other_articles = EXCLUDED.other_articles
  `
}
