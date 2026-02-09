import { NextRequest, NextResponse } from 'next/server'
import { deleteNewsletterSubscriberByEmail } from '@/lib/newsletter-db'
import { removeResendContact } from '@/lib/resend-contacts'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const deleted = await deleteNewsletterSubscriberByEmail(email)
    
    // Remove from Resend Contacts if enabled
    await removeResendContact(email)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Email not found in subscribers list' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Successfully unsubscribed from newsletter' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error unsubscribing from newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    )
  }
}
