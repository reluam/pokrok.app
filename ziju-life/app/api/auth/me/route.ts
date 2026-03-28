import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  return NextResponse.json({ loggedIn: !!user, ...(user ? { email: user.email } : {}) })
}
