import { NextResponse } from 'next/server'
import { verifyUserSession } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await verifyUserSession()
  return NextResponse.json({ loggedIn: !!user })
}
