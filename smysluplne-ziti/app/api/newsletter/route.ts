import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email je povinný' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný formát emailu' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      // In development, just return success without sending email
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          success: true, 
          message: 'Newsletter subscription successful (development mode)' 
        })
      }
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      )
    }

    // TODO: Save to database if needed
    // For now, just send confirmation email

    // Confirmation email to subscriber
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Potvrzení odběru - Týdenní report experimentátora',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #637363;">Děkujeme za odběr!</h2>
          <p>Vaše emailová adresa <strong>${email}</strong> byla úspěšně přihlášena k odběru Týdenního reportu experimentátora.</p>
          <p>Každý čtvrtek vám přijde jedna vědecky podložená metoda, kterou jsem sám otestoval.</p>
          <p>Pokud jste se k odběru nepřihlásili, můžete tento email ignorovat.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">Smysluplné žití</p>
        </div>
      `,
    })

    // Notification email to admin (optional)
    if (process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: process.env.ADMIN_EMAIL,
        subject: 'Nový odběratel newsletteru',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Nový odběratel newsletteru</h2>
            <p>Email: <strong>${email}</strong></p>
            <p>Datum: ${new Date().toLocaleString('cs-CZ')}</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Děkujeme! Brzy vám přijde potvrzovací email.' 
    })
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Něco se pokazilo. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
