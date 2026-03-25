import { NextRequest, NextResponse } from 'next/server'
import { destroyUserSession } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  await destroyUserSession()
  const res = NextResponse.redirect(new URL('/ucet', req.url))
  res.cookies.delete('lab_email')
  return res
}
