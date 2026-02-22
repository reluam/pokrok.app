import { NextRequest, NextResponse } from 'next/server'
import { addLead, setLeadClickUpTaskId } from '@/lib/leads-db'
import { createLeadInNotion } from '@/lib/notion'
import { createLeadTask } from '@/lib/clickup'
import { getBookingSettings } from '@/lib/booking-settings'

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

    const { clickupListId: listId } = await getBookingSettings()
    const clickUpResult = await createLeadTask({
      listId: listId ?? '',
      name: name ?? '',
      email,
      note: message,
      source,
    })
    if (clickUpResult.ok && clickUpResult.taskId) {
      await setLeadClickUpTaskId(lead.id, clickUpResult.taskId)
    } else if (!clickUpResult.ok) {
      console.warn('ClickUp lead task (Reach out):', clickUpResult.error)
    }

    return NextResponse.json(
      { success: true, leadId: lead.id },
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
