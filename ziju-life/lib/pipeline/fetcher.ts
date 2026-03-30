import Parser from 'rss-parser'
import { sql } from '../database'

const parser = new Parser({
  timeout: 7000,
  headers: {
    'User-Agent': 'ZijuLife-KnowledgePipeline/1.0',
  },
})

export interface FetchResult {
  source: string
  newArticles: number
  errors: string[]
}

async function fetchSingleSource(source: Record<string, unknown>): Promise<FetchResult> {
  try {
    const feed = await parser.parseURL(source.url as string)
    let newCount = 0

    for (const item of feed.items) {
      const articleUrl = item.link || item.guid
      if (!articleUrl) continue

      const existing = await sql`
        SELECT id FROM pipeline_articles WHERE url = ${articleUrl}
      `

      if (existing.length === 0) {
        await sql`
          INSERT INTO pipeline_articles (source_id, title, url, author, published_at, raw_content, content_type)
          VALUES (
            ${source.id as number},
            ${item.title || 'Untitled'},
            ${articleUrl},
            ${item.creator || item.author || null},
            ${item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()},
            ${(item.contentSnippet || item.content || item.summary || '').substring(0, 10000)},
            ${(source.type as string) === 'podcast_rss' ? 'podcast_episode' : 'article'}
          )
        `
        newCount++
      }
    }

    await sql`
      UPDATE pipeline_sources SET last_fetched_at = NOW() WHERE id = ${source.id as number}
    `

    return { source: source.name as string, newArticles: newCount, errors: [] }
  } catch (error) {
    return {
      source: source.name as string,
      newArticles: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

export async function fetchAllSources(): Promise<FetchResult[]> {
  const sources = await sql`
    SELECT * FROM pipeline_sources WHERE is_active = true
  `

  // Fetch all sources in parallel to fit within 10s hobby limit
  const results = await Promise.allSettled(
    sources.map((source) => fetchSingleSource(source))
  )

  return results.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : { source: 'unknown', newArticles: 0, errors: [String(result.reason)] }
  )
}
