import type { Lead } from './leads-db'

/**
 * Očekávané vlastnosti v Notion databázi (názvy a typy):
 * - Jméno (title)
 * - E-mail (rich_text)
 * - Zdroj (select)
 * - Stav (select) – např. "Nový"
 * - Datum (date)
 * - Poznámka (rich_text) – volitelně
 * - UTM (rich_text) – volitelně, např. "utm_source=google&utm_medium=cpc"
 */
const NOTION_API = 'https://api.notion.com/v1'

export async function createLeadInNotion(lead: Lead): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    return { ok: false, error: 'NOTION_API_KEY or NOTION_DATABASE_ID not set' }
  }

  const utmParts: string[] = []
  if (lead.utm_source) utmParts.push(`utm_source=${lead.utm_source}`)
  if (lead.utm_medium) utmParts.push(`utm_medium=${lead.utm_medium}`)
  if (lead.utm_campaign) utmParts.push(`utm_campaign=${lead.utm_campaign}`)
  const utmString = utmParts.length > 0 ? utmParts.join('&') : null

  const properties: Record<string, unknown> = {
    Jméno: {
      title: [{ text: { content: lead.name || lead.email } }],
    },
    'E-mail': {
      rich_text: [{ text: { content: lead.email } }],
    },
    Zdroj: {
      select: {
        name:
          lead.source === 'koucing'
            ? 'Koučink'
            : lead.source === 'homepage'
              ? 'Homepage'
              : lead.source === 'funnel'
                ? 'Funnel'
                : lead.source,
      },
    },
    Stav: {
      select: { name: 'Nový' },
    },
    Datum: {
      date: { start: lead.createdAt.slice(0, 10) },
    },
  }

  if (lead.message) {
    (properties as Record<string, unknown>)['Poznámka'] = {
      rich_text: [{ text: { content: lead.message.slice(0, 2000) } }],
    }
  }
  if (utmString) {
    (properties as Record<string, unknown>)['UTM'] = {
      rich_text: [{ text: { content: utmString } }],
    }
  }

  try {
    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('Notion API error:', res.status, body)
      return { ok: false, error: `${res.status}: ${body.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    console.error('Notion API request failed:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
