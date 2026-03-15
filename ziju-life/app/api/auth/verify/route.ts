import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, createUserSession } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/ucet?chyba=token', req.url))
  }

  const user = await verifyMagicToken(token)

  if (!user) {
    return NextResponse.redirect(new URL('/ucet?chyba=token', req.url))
  }

  await createUserSession(user.id)
  return NextResponse.redirect(new URL('/ucet', req.url))
}
