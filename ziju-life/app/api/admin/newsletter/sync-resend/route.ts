import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { syncContactsToResend } from '@/lib/resend-contacts'

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await syncContactsToResend()

    return NextResponse.json({
      success: true,
      message: 'Kontakty byly úspěšně synchronizovány do Resend',
    })
  } catch (error: any) {
    console.error('Error syncing contacts to Resend:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při synchronizaci kontaktů' },
      { status: 500 }
    )
  }
}
