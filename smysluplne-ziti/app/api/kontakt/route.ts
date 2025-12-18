import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json()

    // Validace
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Všechna pole jsou povinná.' },
        { status: 400 }
      )
    }

    // Kontrola API klíče
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Emailová služba není nakonfigurována. Kontaktujte administrátora.' },
        { status: 500 }
      )
    }

    // Email pro admina
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #E8871E 0%, #D97706 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #5D4037; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; border-left: 3px solid #E8871E; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Nová kontaktní zpráva</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Jméno:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
              </div>
              <div class="field">
                <div class="label">Zpráva:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Email pro klienta
    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #E8871E 0%, #D97706 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Děkujeme za vaši zprávu</h2>
            </div>
            <div class="content">
              <p>Vážený/á ${name},</p>
              <p>děkujeme za vaši zprávu. Ozveme se vám co nejdříve na email <strong>${email}</strong>.</p>
              <p>S pozdravem,<br>Smysluplné žití</p>
            </div>
          </div>
        </body>
      </html>
    `

    const recipientEmail = process.env.TO_EMAIL || 'onboarding@resend.dev'
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'

    // Odeslání emailu adminovi přes Resend
    const adminResult = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      reply_to: email,
      subject: `Kontaktní formulář - ${name}`,
      html: adminEmailHtml,
    })

    if (adminResult.error) {
      console.error('Error sending admin email:', adminResult.error)
      throw new Error('Nepodařilo se odeslat email')
    }

    // Odeslání potvrzovacího emailu klientovi přes Resend
    const clientResult = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Děkujeme za vaši zprávu - Smysluplné žití',
      html: clientEmailHtml,
    })

    if (clientResult.error) {
      console.error('Error sending client email:', clientResult.error)
      // Admin email se odeslal, takže necháme projít, ale zalogujeme chybu
    }

    return NextResponse.json(
      { message: 'Zpráva byla úspěšně odeslána.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending contact email:', error)
    return NextResponse.json(
      { error: 'Nastala chyba při odesílání zprávy. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
