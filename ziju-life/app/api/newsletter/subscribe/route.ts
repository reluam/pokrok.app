import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { addNewsletterSubscriber } from '@/lib/newsletter-db'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const subscriber = await addNewsletterSubscriber(email)
    
    // Odeslání potvrzovacího emailu uživateli
    if (process.env.RESEND_API_KEY) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
        const unsubscribeUrl = `${siteUrl}/unsubscribe`
        
        const confirmationEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #E8871E; padding-bottom: 10px;">
              Děkuji za přihlášení k newsletteru
            </h2>
            
            <div style="margin-top: 20px;">
              <p>Ahoj,</p>
              <p>Děkuji ti za přihlášení k newsletteru Žiju life. Budu ti posílat novinky o tom, co je u mě nového.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              <p>Pokud už nechceš dostávat emaily, můžeš se kdykoliv <a href="${unsubscribeUrl}" style="color: #E8871E; text-decoration: underline;">odhlásit zde</a>.</p>
              <p style="margin-top: 20px;">S pozdravem,<br />Matěj</p>
            </div>
          </div>
        `

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: 'Děkuji za přihlášení k newsletteru',
          html: confirmationEmailHtml,
        })
      } catch (emailError) {
        // Logujeme chybu, ale nepřerušujeme proces přihlášení
        console.error('Error sending confirmation email:', emailError)
      }
    }
    
    // Odeslání notifikačního emailu na admin email
    if (process.env.RESEND_API_KEY) {
      const adminEmail = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL
      
      if (adminEmail) {
        try {
          const notificationEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #E8871E; padding-bottom: 10px;">
                Nový follower newsletteru
              </h2>
              
              <div style="margin-top: 20px;">
                <p>Máš nového followera newsletteru!</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Datum přihlášení:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                <p>Tento email byl automaticky odeslán při přihlášení k newsletteru.</p>
              </div>
            </div>
          `

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: adminEmail,
            subject: 'Nový follower newsletteru',
            html: notificationEmailHtml,
          })
        } catch (emailError) {
          // Logujeme chybu, ale nepřerušujeme proces přihlášení
          console.error('Error sending notification email:', emailError)
        }
      }
    }
    
    return NextResponse.json(
      { success: true, message: 'Successfully subscribed to newsletter' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error)
    
    if (error.message === 'Email already subscribed') {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}
