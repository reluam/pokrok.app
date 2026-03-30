import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { sql } from '@/lib/database'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const DIGEST_SYSTEM_PROMPT = `Jsi Matěj, kurátor obsahu na žiju.life — českém webu o vědomém žití a osobním rozvoji.
Píšeš týdenní přehled zajímavého výzkumu, tipů a postřehů pro lidi, kteří chtějí žít vědoměji.

Tvůj styl:
- Přátelský, lidský, tykáš
- Propojuješ výzkum s praktickým životem
- Nebojíš se osobního komentáře a názoru
- Krátké odstavce, přehledné nadpisy
- Používáš český jazyk přirozeně, bez akademického žargonu

Formát: Markdown. Délka: 800-1500 slov.`

const VIDEO_SCRIPT_PROMPT = `Na základě tohoto článku napiš krátký video script (2-3 minuty mluvení).
Styl: přirozený, jako bys mluvil ke kamarádovi. Žádné formální úvody.
Začni rovnou zajímavým poznatkem nebo otázkou. Konec = výzva ke sledování žiju.life.
Formát: jednoduchý text s odstavci (ne bullet pointy). Česky.`

export async function POST(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { briefIds, extraItems, personalNote } = await request.json()

    if (!briefIds || briefIds.length === 0) {
      return NextResponse.json({ error: 'No items selected' }, { status: 400 })
    }

    // Fetch selected briefs
    const briefs = await sql`
      SELECT b.*, a.title, a.url, s.name as source_name
      FROM pipeline_briefs b
      JOIN pipeline_articles a ON b.article_id = a.id
      JOIN pipeline_sources s ON a.source_id = s.id
      WHERE b.id = ANY(${briefIds})
      ORDER BY b.relevance_score DESC
    `

    // Build the items context
    const itemsText = briefs.map((b: Record<string, unknown>, i: number) =>
      `${i + 1}. [${b.primary_category}] "${b.title}" (${b.source_name})
   Shrnutí: ${b.summary_cs}
   Klíčový poznatek: ${b.key_insight}
   Content angle: ${b.content_angle}
   Zdroj: ${b.url}`
    ).join('\n\n')

    const extraText = extraItems?.length > 0
      ? `\n\nDALŠÍ POLOŽKY (knihy, podcasty, osobní doporučení):\n${extraItems.map((item: { title: string; description: string }) => `- ${item.title}: ${item.description}`).join('\n')}`
      : ''

    const noteText = personalNote ? `\n\nOSOBNÍ POZNÁMKA OD MATĚJE (zakomponuj do článku):\n${personalNote}` : ''

    // Generate article
    const articleMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: DIGEST_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Napiš týdenní přehled pro žiju.life na základě těchto kurátorských položek:

${itemsText}${extraText}${noteText}

Úkol:
1. Vymysli chytlavý nadpis
2. Napiš úvod, který vtáhne čtenáře
3. Propoj témata do souvislého příběhu (ne jen seznam)
4. U každé položky uveď zdroj s odkazem v markdown formátu
5. Zakončí osobním zamyšlením nebo výzvou k akci

Odpověz ve formátu:
TITLE: nadpis článku
SUBTITLE: krátký podtitulek
---
(zbytek článku v markdown)`
      }],
    })

    const articleText = articleMessage.content[0].type === 'text' ? articleMessage.content[0].text : ''

    // Parse title and subtitle from response
    const titleMatch = articleText.match(/^TITLE:\s*(.+)$/m)
    const subtitleMatch = articleText.match(/^SUBTITLE:\s*(.+)$/m)
    const bodyStart = articleText.indexOf('---')
    const title = titleMatch?.[1]?.trim() || 'Týdenní přehled'
    const subtitle = subtitleMatch?.[1]?.trim() || null
    const body = bodyStart > -1 ? articleText.substring(bodyStart + 3).trim() : articleText

    // Generate video script (separate call)
    const scriptMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: VIDEO_SCRIPT_PROMPT,
      messages: [{ role: 'user', content: body }],
    })

    const videoScript = scriptMessage.content[0].type === 'text' ? scriptMessage.content[0].text : ''

    // Collect all categories and tags
    const allCategories = [...new Set(briefs.flatMap((b: Record<string, unknown>) => (b.categories as string[]) || []))]
    const allTags = [...new Set(briefs.flatMap((b: Record<string, unknown>) => (b.tags as string[]) || []))]

    // Get current ISO week
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

    return NextResponse.json({
      title,
      subtitle,
      body_markdown: body,
      video_script: videoScript,
      pipeline_brief_ids: briefIds,
      categories: allCategories,
      tags: allTags,
      week_number: weekNumber,
      week_year: now.getFullYear(),
    })
  } catch (error) {
    console.error('Digest generation failed:', error)
    return NextResponse.json({ error: 'Generation failed', details: String(error) }, { status: 500 })
  }
}
