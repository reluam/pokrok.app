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
    // Send a notice that there were no articles today
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

  // === TOP 5 ===
  let topSection = ''
  topArticles.forEach((article, index) => {
    const emoji = CATEGORY_EMOJI[article.primary_category] || '📌'
    topSection += `\n*${index + 1}. ${emoji} ${article.title}*\n`
    topSection += `${article.summary_cs}\n`
    topSection += `💡 _Content angle:_ ${article.content_angle}\n`
    topSection += `🔗 <${article.url}|Zdroj: ${article.source_name}> · Relevance: ${article.relevance_score}/10\n`
  })

  // === OTHER ===
  let otherSection = ''
  otherArticles.forEach((article) => {
    const emoji = CATEGORY_EMOJI[article.primary_category] || '📌'
    otherSection += `${emoji} <${article.url}|${article.title}> — ${article.key_insight} _(${article.relevance_score}/10)_\n`
  })

  // === STATS ===
  const categoryCount: Record<string, number> = {}
  articles.forEach((a) => {
    categoryCount[a.primary_category] = (categoryCount[a.primary_category] || 0) + 1
  })
  const statsLine = Object.entries(categoryCount)
    .map(([cat, count]) => `${CATEGORY_EMOJI[cat] || ''} ${count}`)
    .join(' · ')

  // Build Slack blocks
  const blocks: unknown[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📬 žiju life — Denní brief',
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${today} · ${articles.length} nových položek · ${statsLine}`,
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🏆 Top 5 dnes*${topSection}`,
      },
    },
  ]

  if (otherArticles.length > 0) {
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Další zajímavé*\n${otherSection}`,
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
    throw new Error(`Slack webhook failed: ${response.status}`)
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
