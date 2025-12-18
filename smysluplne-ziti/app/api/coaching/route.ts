import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, date, time, message, type } = body

    // Validace
    if (!name || !email || !date) {
      return NextResponse.json(
        { error: 'Všechna povinná pole musí být vyplněna' },
        { status: 400 }
      )
    }

    // Pro free konzultaci není čas povinný
    const isFreeConsultation = type === 'free'

    // Kontrola API klíče
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Emailová služba není nakonfigurována. Kontaktujte administrátora.' },
        { status: 500 }
      )
    }

    const recipientEmail = process.env.RECIPIENT_EMAIL || process.env.FROM_EMAIL

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Email příjemce není nakonfigurován.' },
        { status: 500 }
      )
    }

    // Formátování data
    const formattedDate = new Date(date).toLocaleDateString('cs-CZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const consultationType = isFreeConsultation ? 'Zdarma konzultace' : 'Placená konzultace'
    const subjectPrefix = isFreeConsultation ? 'Nová žádost o zdarma konzultaci' : 'Nová rezervace coaching sezení'

    // Email pro vás (s rezervací)
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E8871E;">${subjectPrefix}</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Typ:</strong> ${consultationType}</p>
          <p><strong>Jméno:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Datum:</strong> ${formattedDate}</p>
          ${time ? `<p><strong>Čas:</strong> ${time}</p>` : '<p><strong>Čas:</strong> <em>Bude upřesněn později</em></p>'}
          ${message ? `<p><strong>Zpráva:</strong><br>${message.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Rezervace přijata: ${new Date().toLocaleString('cs-CZ')}</p>
      </div>
    `

    // Email pro klienta (potvrzení)
    const clientEmailHtml = isFreeConsultation ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E8871E;">Děkujeme za váš zájem o zdarma konzultaci!</h2>
        <p>Vážený/á ${name},</p>
        <p>děkujeme za vaši žádost o zdarma konzultační hodinu. Potvrzujeme váš zájem o datum:</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Datum:</strong> ${formattedDate}</p>
        </div>
        <p><strong>Ozveme se vám s konkrétním časem na email ${email}.</strong></p>
        <p style="margin-top: 30px;">S pozdravem,<br><strong>Smysluplné žití</strong></p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E8871E;">Děkujeme za vaši rezervaci!</h2>
        <p>Vážený/á ${name},</p>
        <p>potvrzujeme vaši rezervaci coaching sezení:</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Datum:</strong> ${formattedDate}</li>
            <li style="margin: 10px 0;"><strong>Čas:</strong> ${time}</li>
          </ul>
        </div>
        <p>Brzy vás budeme kontaktovat na email <strong>${email}</strong> pro potvrzení a další detaily.</p>
        <p style="margin-top: 30px;">S pozdravem,<br><strong>Smysluplné žití</strong></p>
      </div>
    `

    // Odeslání emailu administrátorovi
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev', // Musí být ověřená doména v Resend
      to: recipientEmail,
      reply_to: email,
      subject: `${subjectPrefix} - ${name}`,
      html: adminEmailHtml,
    })

    // Odeslání potvrzovacího emailu klientovi
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Potvrzení rezervace coaching sezení',
      html: clientEmailHtml,
    })

    return NextResponse.json(
      { 
        success: true,
        message: isFreeConsultation 
          ? 'Děkujeme za váš zájem! Ozveme se vám s konkrétním časem.'
          : 'Rezervace byla úspěšně odeslána. Brzy vás budeme kontaktovat.' 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error processing coaching reservation:', error)
    return NextResponse.json(
      { error: 'Nastala chyba při odesílání rezervace. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
