import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { syncContactsToResend } from '@/lib/resend-contacts'

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncContactsToResend()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: `Synchronizace dokončena s chybami: ${result.synced} úspěšných, ${result.failed} selhalo`,
        synced: result.synced,
        failed: result.failed,
        errors: result.errors,
      }, { status: 207 }) // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: `Kontakty byly úspěšně synchronizovány do Resend (${result.synced} kontaktů)`,
      synced: result.synced,
      failed: result.failed,
    })
  } catch (error: any) {
    console.error('Error syncing contacts to Resend:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při synchronizaci kontaktů' },
      { status: 500 }
    )
  }
}
