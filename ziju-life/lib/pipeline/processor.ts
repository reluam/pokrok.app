import Anthropic from '@anthropic-ai/sdk'
import { sql } from '../database'
import { CATEGORIES } from './sources'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const ANALYSIS_SYSTEM_PROMPT = `Jsi kurátor obsahu pro český web žiju.life zaměřený na vědomé žití a osobní rozvoj.
Tvůj úkol je analyzovat článek/studii a vyhodnotit jeho relevanci pro české publikum zajímající se o to, jak žít vědoměji a lépe.

Zakladatel projektu (Matěj) se zaměřuje na: mindfulness, přítomnost, návyky, vědomé rozhodování, zdraví (keto, spánek, pohyb), produktivitu, vztahy a neurovědu.

Odpověz POUZE validním JSON objektem (bez markdown, bez backticks):

{
  "summary_cs": "České shrnutí v 2-3 větách. Jasné, srozumitelné, bez akademického žargonu.",
  "summary_en": "English summary in 1-2 sentences for reference.",
  "relevance_score": 7,
  "categories": ["psychology", "mindfulness"],
  "primary_category": "mindfulness",
  "content_angle": "Konkrétní návrh, jak z tohoto udělat obsah pro žiju life. Např: 'Návaznost na koncept deliberate boredom — tato studie přináší tvrdá data.' nebo 'Ideální téma pro reel: 3 věci, které dělají šťastní lidé jinak.'",
  "key_insight": "Jeden hlavní poznatek v jedné české větě.",
  "tags": ["spánek", "kortizol", "studie"]
}

Kategorie: ${Object.entries(CATEGORIES).map(([key, val]) => `${key} = ${val.label}`).join(', ')}

Pravidla pro relevance_score:
- 9-10: Přímo se týká vědomého žití, přítomnosti, mindfulness. Průlomový výzkum.
- 7-8: Velmi relevantní pro životní styl a osobní rozvoj. Prakticky aplikovatelné.
- 5-6: Zajímavé, ale okrajově související. Mohlo by být součástí širšího kontextu.
- 3-4: Okrajově relevantní. Spíše pro informaci.
- 1-2: Minimální relevance pro žiju life.`

/** Fetch recent saved articles as positive signal for the AI to learn preferences. */
async function getFeedbackContext(): Promise<string> {
  const saved = await sql`
    SELECT b.summary_cs, b.primary_category, b.relevance_score, b.tags
    FROM pipeline_briefs b
    WHERE b.pipeline_status = 'saved'
    ORDER BY b.saved_at DESC NULLS LAST
    LIMIT 15
  `

  if (saved.length === 0) return ''

  const savedList = saved.map((s: Record<string, unknown>) =>
    `- [${s.primary_category}, skóre ${s.relevance_score}] ${s.summary_cs} (tagy: ${(s.tags as string[])?.join(', ') || '–'})`
  ).join('\n')

  return `

DŮLEŽITÉ — Zpětná vazba od kurátora:
Níže jsou články, které kurátor ULOŽIL (= považoval za hodnotné). Využij to k lepšímu odhadu relevance:

ULOŽENÉ (chtěné):
${savedList}

Články, které kurátor neoznačil jako uložené, byly většinou smazány — buď kvůli nízké relevanci, duplicitě, nebo obecnosti.
Zohledni tyto preference při hodnocení relevance nového článku.`
}

/**
 * Process a small batch of unprocessed articles.
 * Designed for Vercel hobby plan (10s limit) — processes max 3 articles per call.
 * Call this endpoint multiple times to process all articles.
 */
export async function processUnprocessedArticles(batchSize = 3): Promise<{ processed: number; remaining: number }> {
  const batch = await sql`
    SELECT a.* FROM pipeline_articles a
    LEFT JOIN pipeline_briefs b ON a.id = b.article_id
    WHERE b.id IS NULL
      AND a.fetched_at > NOW() - INTERVAL '48 hours'
    ORDER BY a.published_at DESC
    LIMIT ${batchSize}
  `

  const countResult = await sql`
    SELECT COUNT(*)::int as cnt FROM pipeline_articles a
    LEFT JOIN pipeline_briefs b ON a.id = b.article_id
    WHERE b.id IS NULL
      AND a.fetched_at > NOW() - INTERVAL '48 hours'
  `
  const remaining = Math.max(0, (countResult[0]?.cnt || 0) - batch.length)
  let processedCount = 0

  // Load curator feedback to refine AI relevance scoring
  const feedbackContext = await getFeedbackContext()

  for (const article of batch) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: ANALYSIS_SYSTEM_PROMPT + feedbackContext,
        messages: [
          {
            role: 'user',
            content: `Analyzuj tento článek:

Titulek: ${article.title}
Zdroj URL: ${article.url}
Obsah/popis: ${(article.raw_content || 'Není k dispozici').substring(0, 3000)}
Typ: ${article.content_type}
Datum: ${article.published_at}`,
          },
        ],
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const analysis = JSON.parse(responseText)

      // Skip low-relevance articles entirely
      if (analysis.relevance_score < 5) {
        await sql`DELETE FROM pipeline_articles WHERE id = ${article.id}`
        processedCount++
        continue
      }

      await sql`
        INSERT INTO pipeline_briefs (article_id, summary_cs, summary_en, relevance_score, categories, primary_category, content_angle, key_insight, tags)
        VALUES (
          ${article.id},
          ${analysis.summary_cs},
          ${analysis.summary_en || null},
          ${analysis.relevance_score},
          ${analysis.categories},
          ${analysis.primary_category},
          ${analysis.content_angle || null},
          ${analysis.key_insight || null},
          ${analysis.tags || []}
        )
      `

      processedCount++
    } catch (error) {
      console.error(`Failed to process article ${article.id}:`, error)
    }
  }

  return { processed: processedCount, remaining }
}
