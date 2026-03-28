import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser, createMagicToken } from '@/lib/user-auth'
import { sendMagicLinkEmail } from '@/lib/user-email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, next, source } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Neplatný e-mail.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const nextUrl = typeof next === 'string' && next.startsWith('/') ? next : undefined


    const user = await getOrCreateUser(normalizedEmail)
    const { token, code } = await createMagicToken(user.id)

    const result = await sendMagicLinkEmail(normalizedEmail, token, nextUrl, source, code)
    if (!result.ok) {
      console.error('[magic-link] Email send failed:', result.error)
      return NextResponse.json(
        { error: 'Nepodařilo se odeslat e-mail. Zkus to prosím znovu.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[magic-link] Error:', err)
    return NextResponse.json({ error: 'Interní chyba serveru.' }, { status: 500 })
  }
}
