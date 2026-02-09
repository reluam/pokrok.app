import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  getScheduledCampaignsToSend,
  markCampaignAsSent,
} from '@/lib/newsletter-campaigns-db'
import type { NewsletterSection } from '@/lib/newsletter-campaigns-db'
import { getNewsletterSubscribers } from '@/lib/newsletter-db'
import { getSubscribers, sendNewsletterBroadcast } from '@/lib/resend-contacts'

const resend = new Resend(process.env.RESEND_API_KEY)
const USE_RESEND_CONTACTS = process.env.USE_RESEND_CONTACTS === 'true'

// Render newsletter email template
function renderNewsletterEmail(
  body: string,
  siteUrl: string, 
  unsubscribeUrl: string
): string {
  // Process body HTML - ensure links and blockquotes have proper styling
  let bodyHtml = body || '';
  
  // Ensure all links have proper styling
  bodyHtml = bodyHtml.replace(
    /<a\s+href=["']([^"']+)["']([^>]*)>([^<]+)<\/a>/gi,
    (match, url, attrs, text) => {
      // Check if style is already present
      if (attrs && attrs.includes('style=')) {
        return match;
      }
      return `<a href="${url}" style="color: #FF8C42; text-decoration: underline;"${attrs}>${text}</a>`;
    }
  );
  
  // Ensure all blockquotes have proper styling (if not already styled)
  bodyHtml = bodyHtml.replace(
    /<blockquote([^>]*)>/gi,
    (match, attrs) => {
      // Check if style is already present
      if (attrs && attrs.includes('style=')) {
        return match;
      }
      return `<blockquote style="border-left: 4px solid #FF8C42 !important; padding: 6px 16px !important; margin: 16px 0 !important; color: #666 !important; font-style: italic !important; background-color: #FFF5ED !important;"${attrs}>`;
    }
  );
  
  // Wrap body content in styled div
  const bodyContentHtml = bodyHtml.trim()
    ? `<div style="color: #171717; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${bodyHtml}</div>`
    : '<p style="color: #171717; font-size: 16px; line-height: 1.6;">Žádný obsah</p>';
  
  return `
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
                  <a href="${siteUrl}" style="display: inline-block; text-decoration: none; border: 0;">
                    <img src="${siteUrl}/ziju-life-logo.png" alt="Žiju life" width="200" height="80" style="max-width: 200px; width: 200px; height: auto; display: block; border: 0; outline: none; text-decoration: none;" />
                  </a>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${bodyContentHtml}
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
}

// Generate plain text version of newsletter
function renderNewsletterText(
  body: string,
  unsubscribeUrl: string
): string {
  // Strip HTML tags and convert to plain text
  const stripHtml = (html: string): string => {
    return html
      .replace(/<a\s+href=["']([^"']+)["']>([^<]+)<\/a>/gi, '$2 ($1)')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n$1\n' + '='.repeat(50) + '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  };

  let text = stripHtml(body);
  
  text += '\n\n---\n';
  text += `Odhlásit se z odběru: ${unsubscribeUrl}\n`;
  
  return text;
}

// GET - Cron endpoint for sending scheduled newsletters
// This should be called by Vercel Cron Jobs
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaigns = await getScheduledCampaignsToSend()
    
    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No campaigns to send',
        sent: 0,
      })
    }

    const subscribers = await getSubscribers()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
    const unsubscribeUrl = `${siteUrl}/unsubscribe`

    let sentCount = 0
    let errorCount = 0

    for (const campaign of campaigns) {
      try {
        const emailHtml = renderNewsletterEmail(campaign.body || '', siteUrl, unsubscribeUrl)
        const textVersion = renderNewsletterText(campaign.body || '', unsubscribeUrl)

        // Use Resend Broadcasts API if enabled, otherwise send individual emails
        if (USE_RESEND_CONTACTS) {
          const broadcastResult = await sendNewsletterBroadcast(
            campaign.subject,
            emailHtml,
            textVersion
          )
          
          if (broadcastResult) {
            await markCampaignAsSent(campaign.id)
            sentCount++
          } else {
            // Fallback to individual emails if broadcast fails
            console.log('Broadcast failed, falling back to individual emails')
            const emailPromises = subscribers.map((subscriber) =>
              resend.emails.send({
                from: campaign.sender || 'Matěj Mauler <matej@mail.ziju.life>',
                replyTo: campaign.sender?.match(/<([^>]+)>/)?.[1] || 'matej@mail.ziju.life',
                to: subscriber.email,
                subject: campaign.subject,
                html: emailHtml,
                text: textVersion,
                headers: {
                  'List-Unsubscribe': `<${unsubscribeUrl}?email=${encodeURIComponent(subscriber.email)}>`,
                  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
              })
            )
            await Promise.all(emailPromises)
            await markCampaignAsSent(campaign.id)
            sentCount++
          }
        } else {
          // Send to all subscribers individually
          const emailPromises = subscribers.map((subscriber) =>
            resend.emails.send({
              from: 'Matěj Mauler <matej@mail.ziju.life>',
              replyTo: 'matej@mail.ziju.life',
              to: subscriber.email,
              subject: campaign.subject,
              html: emailHtml,
              text: textVersion,
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}?email=${encodeURIComponent(subscriber.email)}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            })
          )

          await Promise.all(emailPromises)
          await markCampaignAsSent(campaign.id)
          sentCount++
        }
      } catch (error) {
        console.error(`Error sending campaign ${campaign.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      message: `Processed ${sentCount} campaigns, ${errorCount} errors`,
    })
  } catch (error: any) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      { error: 'Failed to process newsletters' },
      { status: 500 }
    )
  }
}
