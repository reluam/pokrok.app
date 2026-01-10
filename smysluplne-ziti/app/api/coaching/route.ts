import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, date, message } = body

    if (!name || !email || !date) {
      return NextResponse.json(
        { error: 'Jméno, email a datum jsou povinné' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      )
    }

    // Email pro uživatele
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      reply_to: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      subject: 'Rezervace úvodní konzultace zdarma - Smyslužití',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E8871E;">Děkujeme za vaši rezervaci!</h2>
          <p>Ahoj ${name},</p>
          <p>Děkujeme za rezervaci úvodní konzultace zdarma. Vaše preferované datum je <strong>${new Date(date).toLocaleDateString('cs-CZ')}</strong>.</p>
          <p>Ozvu se vám co nejdříve s konkrétním časem, který vám bude vyhovovat.</p>
          ${message ? `<p><strong>Vaše zpráva:</strong><br>${message}</p>` : ''}
          <p>S pozdravem,<br>Matěj<br>Smyslužití</p>
        </div>
      `,
    })

    // Email pro majitele
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.RESEND_TO_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      reply_to: email,
      subject: `Nová rezervace úvodní konzultace zdarma - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E8871E;">Nová rezervace úvodní konzultace zdarma</h2>
          <p><strong>Jméno:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Preferované datum:</strong> ${new Date(date).toLocaleDateString('cs-CZ')}</p>
          ${message ? `<p><strong>Zpráva:</strong><br>${message}</p>` : ''}
        </div>
      `,
    })

    return NextResponse.json({
      message: 'Rezervace byla úspěšně odeslána. Ozvu se vám s konkrétním časem.',
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Nastala chyba při odesílání rezervace. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
