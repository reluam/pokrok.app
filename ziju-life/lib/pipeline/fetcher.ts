import Parser from 'rss-parser'
import { sql } from '../database'

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'ZijuLife-KnowledgePipeline/1.0',
  },
})

export interface FetchResult {
  source: string
  newArticles: number
  errors: string[]
}

export async function fetchAllSources(): Promise<FetchResult[]> {
  const results: FetchResult[] = []

  const sources = await sql`
    SELECT * FROM pipeline_sources WHERE is_active = true
  `

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url)
      let newCount = 0

      for (const item of feed.items) {
        const articleUrl = item.link || item.guid
        if (!articleUrl) continue

        // Check for duplicate
        const existing = await sql`
          SELECT id FROM pipeline_articles WHERE url = ${articleUrl}
        `

        if (existing.length === 0) {
          await sql`
            INSERT INTO pipeline_articles (source_id, title, url, author, published_at, raw_content, content_type)
            VALUES (
              ${source.id},
              ${item.title || 'Untitled'},
              ${articleUrl},
              ${item.creator || item.author || null},
              ${item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()},
              ${(item.contentSnippet || item.content || item.summary || '').substring(0, 10000)},
              ${source.type === 'podcast_rss' ? 'podcast_episode' : 'article'}
            )
          `
          newCount++
        }
      }

      // Update last_fetched_at
      await sql`
        UPDATE pipeline_sources SET last_fetched_at = NOW() WHERE id = ${source.id}
      `

      results.push({ source: source.name, newArticles: newCount, errors: [] })
    } catch (error) {
      results.push({
        source: source.name,
        newArticles: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      })
    }
  }

  return results
}
