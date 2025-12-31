import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend only when API key is available (not during build)
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, type, message } = body

    // Validation
    if (!name || !email || !type || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const fromEmail = process.env.FROM_MAIL || 'noreply@pokrok.app'
    const toEmail = process.env.TO_MAIL || 'matej.mauler@gmail.com'

    // Type labels
    const typeLabels: Record<string, string> = {
      bug: 'Bug',
      request: 'Požadavek',
      other: 'Jiné'
    }

    const typeLabel = typeLabels[type] || type

    // Initialize Resend
    let resend
    try {
      resend = getResend()
    } catch (resendError) {
      console.error('Error initializing Resend:', resendError)
      return NextResponse.json(
        { error: 'Email service not configured', details: resendError instanceof Error ? resendError.message : String(resendError) },
        { status: 500 }
      )
    }

    // Send email to admin
    const adminEmailResult = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `[Pokrok] ${typeLabel} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            Nová zpráva z kontaktního formuláře
          </h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Jméno:</strong> ${name}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>Typ:</strong> ${typeLabel}</p>
            <p><strong>Zpráva:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Tato zpráva byla odeslána z kontaktního formuláře na pokrok.app
          </p>
        </div>
      `,
      text: `
Nová zpráva z kontaktního formuláře

Jméno: ${name}
E-mail: ${email}
Typ: ${typeLabel}

Zpráva:
${message}

---
Tato zpráva byla odeslána z kontaktního formuláře na pokrok.app
      `.trim(),
    })

    if (adminEmailResult.error) {
      console.error('Error sending admin email:', adminEmailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Send confirmation email to user
    const confirmationEmailResult = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Děkujeme za vaši zprávu - Pokrok',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            Děkujeme za vaši zprávu!
          </h2>
          <p style="color: #666; line-height: 1.6;">
            Ahoj ${name},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Děkujeme za kontaktování týmu Pokrok. Vaše zpráva byla úspěšně přijata a odpovíme vám co nejdříve.
          </p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Typ:</strong> ${typeLabel}</p>
            <p style="margin: 10px 0 0 0; color: #333;"><strong>Vaše zpráva:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap; color: #666;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; line-height: 1.6; margin-top: 20px;">
            S pozdravem,<br>
            <strong>Tým Pokrok</strong>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Tento e-mail byl automaticky odeslán jako potvrzení přijetí vaší zprávy.
          </p>
        </div>
      `,
      text: `
Děkujeme za vaši zprávu!

Ahoj ${name},

Děkujeme za kontaktování týmu Pokrok. Vaše zpráva byla úspěšně přijata a odpovíme vám co nejdříve.

Typ: ${typeLabel}

Vaše zpráva:
${message}

S pozdravem,
Tým Pokrok

---
Tento e-mail byl automaticky odeslán jako potvrzení přijetí vaší zprávy.
      `.trim(),
    })

    if (confirmationEmailResult.error) {
      console.error('Error sending confirmation email:', confirmationEmailResult.error)
      // Don't fail the request if confirmation email fails, admin email was sent
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing contact form:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

