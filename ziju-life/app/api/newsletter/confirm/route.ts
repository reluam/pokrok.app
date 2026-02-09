import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { confirmPendingSubscription } from '@/lib/newsletter-db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Chybí potvrzovací token' },
        { status: 400 }
      )
    }

    // Confirm the subscription
    const subscriber = await confirmPendingSubscription(token)
    
    // Send welcome email after confirmation
    if (process.env.RESEND_API_KEY) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
        const unsubscribeUrl = `${siteUrl}/unsubscribe`
        
        const welcomeEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #FDFDF7; font-family: Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FDFDF7;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background-color: #FDFDF7;">
                        <img src="${siteUrl}/ziju-life-logo.png" alt="Žiju life" style="max-width: 200px; height: auto;" />
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 0 40px 40px;">
                        <h1 style="color: #171717; font-size: 28px; font-weight: bold; margin: 0 0 20px; line-height: 1.3;">
                          Vítej v newsletteru Žiju life!
                        </h1>
                        
                        <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                          Ahoj,<br><br>
                          Děkuji ti za potvrzení odběru newsletteru Žiju life. Každý týden ti pošlu shrnutí toho, co je u mě nového.
                        </p>
                        
                        <!-- Divider -->
                        <div style="height: 1px; background-color: #e5e5e5; margin: 30px 0;"></div>
                        
                        <!-- What to Expect Section -->
                        <h2 style="color: #171717; font-size: 20px; font-weight: bold; margin: 0 0 25px;">
                          Co můžeš očekávat:
                        </h2>
                        
                        <!-- Inspiration -->
                        <div style="margin-bottom: 25px; padding: 20px; background-color: #FDFDF7; border-radius: 8px; border-left: 4px solid #FF8C42;">
                          <p style="color: #171717; font-size: 18px; font-weight: bold; margin: 0 0 8px;">
                            📚 Inspirace
                          </p>
                          <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0;">
                            Co právě čtu já a co doporučují ostatní v komunitě Žijem life.
                          </p>
                        </div>
                        
                        <!-- Experiments -->
                        <div style="margin-bottom: 25px; padding: 20px; background-color: #FDFDF7; border-radius: 8px; border-left: 4px solid #FF8C42;">
                          <p style="color: #171717; font-size: 18px; font-weight: bold; margin: 0 0 8px;">
                            🧪 Experimenty
                          </p>
                          <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0;">
                            Jaký je aktuální experiment, a jak se k němu přidat.
                          </p>
                        </div>
                        
                        <!-- Articles -->
                        <div style="margin-bottom: 30px; padding: 20px; background-color: #FDFDF7; border-radius: 8px; border-left: 4px solid #FF8C42;">
                          <p style="color: #171717; font-size: 18px; font-weight: bold; margin: 0 0 8px;">
                            ✍️ Články
                          </p>
                          <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0;">
                            Nad čím zrovna přemýšlím.
                          </p>
                        </div>
                        
                        <!-- Divider -->
                        <div style="height: 1px; background-color: #e5e5e5; margin: 30px 0;"></div>
                        
                        <!-- Closing -->
                        <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0;">
                          S pozdravem,<br>
                          <strong>Matěj</strong>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #FDFDF7; border-top: 1px solid #e5e5e5;">
                        <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                          <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Odhlásit se z odběru</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: subscriber.email,
          subject: 'Vítej v newsletteru Žiju life',
          html: welcomeEmailHtml,
        })
      } catch (emailError) {
        // Log error but don't fail the confirmation
        console.error('Error sending welcome email:', emailError)
      }
    }
    
    // Send notification email to admin after confirmation
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
                <p><strong>Email:</strong> ${subscriber.email}</p>
                <p><strong>Datum přihlášení:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                <p>Tento email byl automaticky odeslán při potvrzení odběru newsletteru.</p>
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
          // Log error but don't fail the confirmation
          console.error('Error sending notification email:', emailError)
        }
      }
    }
    
    // Redirect to success page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
    return NextResponse.redirect(`${siteUrl}/newsletter/confirm?success=true`)
  } catch (error: any) {
    console.error('Error confirming subscription:', error)
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
    
    if (error.message === 'Invalid or expired confirmation token') {
      return NextResponse.redirect(`${siteUrl}/newsletter/confirm?error=invalid`)
    }
    
    if (error.message === 'Confirmation token has expired') {
      return NextResponse.redirect(`${siteUrl}/newsletter/confirm?error=expired`)
    }
    
    if (error.message === 'Email already subscribed') {
      return NextResponse.redirect(`${siteUrl}/newsletter/confirm?error=already_subscribed`)
    }
    
    return NextResponse.redirect(`${siteUrl}/newsletter/confirm?error=unknown`)
  }
}
