import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Jméno a email jsou povinné' },
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
      subject: 'Děkuji za tvou zprávu - Smyslužití',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E8871E;">Děkujeme za vaši zprávu!</h2>
          <p>Ahoj ${name},</p>
          <p>Děkuji za tvůj zájem o individuální koučink. Ozvu se ti co nejdříve s konkrétním časem, který ti bude vyhovovat.</p>
          ${message ? `<p><strong>Tvoje zpráva:</strong><br>${message}</p>` : ''}
          <p>S pozdravem,<br>Matěj<br>Smyslužití</p>
        </div>
      `,
    })

    // Email pro majitele
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.RESEND_TO_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      reply_to: email,
      subject: `Nová zpráva z kontaktního formuláře - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E8871E;">Nová zpráva z kontaktního formuláře</h2>
          <p><strong>Jméno:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
          ${message ? `<p><strong>Zpráva:</strong><br>${message}</p>` : ''}
        </div>
      `,
    })

    return NextResponse.json({
      message: 'Děkuji za tvou zprávu! Ozvu se ti co nejdříve.',
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Nastala chyba při odesílání rezervace. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
