import { NextRequest, NextResponse } from 'next/server'
import { addLead } from '@/lib/leads-db'
import { createLeadInNotion } from '@/lib/notion'

/** Redirect po odeslání leada (cal.com/cal.eu). Volitelně nastav NEXT_PUBLIC_CAL_EU_BOOKING_URL. */
const BOOKING_PAGE_URL =
  process.env.NEXT_PUBLIC_CAL_EU_BOOKING_URL || 'https://cal.com/matej-mauler/30min'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const message = typeof body.message === 'string' ? body.message.trim() : undefined
    const source = typeof body.source === 'string' ? body.source : 'koucing'

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný nebo chybějící e-mail.' },
        { status: 400 }
      )
    }
    if (!name || !name.length) {
      return NextResponse.json(
        { error: 'Jméno je povinné.' },
        { status: 400 }
      )
    }

    const utm_source = typeof body.utm_source === 'string' ? body.utm_source : undefined
    const utm_medium = typeof body.utm_medium === 'string' ? body.utm_medium : undefined
    const utm_campaign = typeof body.utm_campaign === 'string' ? body.utm_campaign : undefined

    const lead = await addLead({
      email,
      name,
      message,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
    })

    const notionResult = await createLeadInNotion(lead)
    if (!notionResult.ok) {
      console.warn('Notion sync failed (lead saved locally):', notionResult.error)
    }

    return NextResponse.json(
      { success: true, redirectUrl: BOOKING_PAGE_URL },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/leads error:', error)
    return NextResponse.json(
      { error: 'Nepodařilo se odeslat. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
