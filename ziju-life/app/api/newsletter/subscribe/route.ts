import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createPendingSubscription } from '@/lib/newsletter-db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email je povinný' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný formát emailu' },
        { status: 400 }
      )
    }

    // Create pending subscription instead of directly adding to DB
    const pendingSub = await createPendingSubscription(email)
    
    // Send confirmation email with verification link
    if (process.env.RESEND_API_KEY) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
        const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${pendingSub.token}`
        
        const confirmationEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #E8871E; padding-bottom: 10px;">
              Potvrď svůj odběr newsletteru
            </h2>
            
            <div style="margin-top: 20px;">
              <p>Ahoj,</p>
              <p>Děkuji ti za zájem o newsletter Žiju life. Pro dokončení přihlášení prosím potvrď svůj email kliknutím na tlačítko níže.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #E8871E; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Potvrdit odběr
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              <p>Pokud tlačítko nefunguje, zkopíruj a vlož tento odkaz do prohlížeče:</p>
              <p style="word-break: break-all; color: #E8871E;">${confirmUrl}</p>
              <p style="margin-top: 20px;">Pokud jsi se k odběru nepřihlásil/a, můžeš tento email ignorovat.</p>
              <p style="margin-top: 20px;">S pozdravem,<br />Matěj</p>
            </div>
          </div>
        `

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: 'Potvrď svůj odběr newsletteru Žiju life',
          html: confirmationEmailHtml,
        })
      } catch (emailError) {
        // If email fails, we should still return success but log the error
        console.error('Error sending confirmation email:', emailError)
        // Note: In production, you might want to handle this differently
      }
    }
    
    return NextResponse.json(
      { success: true, message: 'Děkuji za odběr! Aby to bylo ofiko, potvrď ještě prosím odběr v mailu.' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error)
    
    if (error.message === 'Email already subscribed') {
      return NextResponse.json(
        { error: 'Tento email je již přihlášený k newsletteru' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Nepodařilo se přihlásit k newsletteru' },
      { status: 500 }
    )
  }
}
