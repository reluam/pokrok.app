import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { Resend } from 'resend'
import {
  getScheduledCampaignsToSend,
  markCampaignAsSent,
  getNewsletterCampaign,
} from '@/lib/newsletter-campaigns-db'
import { getNewsletterSubscribers } from '@/lib/newsletter-db'

const resend = new Resend(process.env.RESEND_API_KEY)

import type { NewsletterSection } from '@/lib/newsletter-campaigns-db'

// Render newsletter email template
function renderNewsletterEmail(
  description: string,
  sections: NewsletterSection[], 
  siteUrl: string, 
  unsubscribeUrl: string
): string {
  // Convert text with HTML links to properly formatted HTML
  const convertTextToHtml = (text: string): string => {
    // Extract and preserve HTML links BEFORE escaping
    const linkRegex = /<a\s+href=["']([^"']+)["']>([^<]+)<\/a>/gi;
    const links: Array<{ url: string; text: string; placeholder: string }> = [];
    let linkIndex = 0;
    
    // First pass: extract all links and replace with placeholders
    let processedText = text.replace(linkRegex, (match, url, linkText) => {
      const placeholder = `__LINK_PLACEHOLDER_${linkIndex}__`;
      links.push({ 
        url: url.trim(), 
        text: linkText.trim(), 
        placeholder
      });
      linkIndex++;
      return placeholder;
    });
    
    // Escape HTML entities in the remaining text (but not in placeholders)
    processedText = processedText
      .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[\da-f]+;|__LINK_PLACEHOLDER_)/gi, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Restore links with proper styling (replace placeholders)
    links.forEach(({ url, text, placeholder }) => {
      // Don't escape URL - it should remain as-is
      const cleanUrl = url.replace(/&amp;/g, '&');
      // Escape text content properly
      const escapedText = text
        .replace(/&amp;/g, '&')
        .replace(/&/g, '&amp;')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      const linkHtml = `<a href="${cleanUrl}" style="color: #FF8C42; text-decoration: underline;">${escapedText}</a>`;
      processedText = processedText.replace(placeholder, linkHtml);
    });
    
    // Convert standalone URLs to links (only if not already in a link)
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    processedText = processedText.replace(urlRegex, (url) => {
      // Check if URL is already inside a link tag
      if (processedText.includes(`href="${url}"`) || processedText.includes(`href='${url}'`)) {
        return url;
      }
      // Don't convert if it's part of an escaped HTML tag
      const beforeUrl = processedText.substring(0, processedText.indexOf(url));
      if (beforeUrl.endsWith('&lt;') || beforeUrl.endsWith('&gt;')) {
        return url;
      }
      return `<a href="${url}" style="color: #FF8C42; text-decoration: underline;">${url}</a>`;
    });
    
    // Convert line breaks
    processedText = processedText.replace(/\n\n/g, '</p><p style="margin: 16px 0;">');
    processedText = processedText.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!processedText.startsWith('<')) {
      processedText = `<p style="margin: 0 0 16px;">${processedText}</p>`;
    }
    
    return processedText;
  };
  
  const sectionsHtml = sections
    .filter((section) => section.title.trim() || section.description.trim())
    .map((section) => {
      const titleHtml = section.title.trim() 
        ? `<h2 style="color: #171717; font-size: 22px; font-weight: bold; margin: 0 0 12px; line-height: 1.3;">${section.title}</h2>`
        : '';
      const descriptionHtml = section.description.trim()
        ? `<div style="color: #171717; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${convertTextToHtml(section.description)}</div>`
        : '';
      
      return titleHtml + descriptionHtml;
    })
    .join('');
  
  const descriptionHtml = description.trim()
    ? `<div style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 24px; font-style: italic;">${convertTextToHtml(description)}</div>`
    : '';
  
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
                  ${descriptionHtml}
                  ${sectionsHtml || '<p style="color: #171717; font-size: 16px; line-height: 1.6;">Žádný obsah</p>'}
                  
                  <!-- Divider -->
                  <div style="height: 1px; background-color: #e5e5e5; margin: 30px 0;"></div>
                  
                  <!-- Closing -->
                  <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0;">
                    Matěj | Žiju life
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
}

// POST - Send campaign manually or process scheduled campaigns
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, sendScheduled } = body

    // If sendScheduled is true, process all scheduled campaigns
    if (sendScheduled) {
      const campaigns = await getScheduledCampaignsToSend()
      const subscribers = await getNewsletterSubscribers()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
      const unsubscribeUrl = `${siteUrl}/unsubscribe`

      let sentCount = 0
      let errorCount = 0

    for (const campaign of campaigns) {
      try {
        const emailHtml = renderNewsletterEmail(campaign.description || '', campaign.sections, siteUrl, unsubscribeUrl)

          // Send to all subscribers
          const emailPromises = subscribers.map((subscriber) =>
            resend.emails.send({
              from: 'Matěj Mauler <matej@mail.ziju.life>',
              to: subscriber.email,
              subject: campaign.subject,
              html: emailHtml,
            })
          )

          await Promise.all(emailPromises)
          await markCampaignAsSent(campaign.id)
          sentCount++
        } catch (error) {
          console.error(`Error sending campaign ${campaign.id}:`, error)
          errorCount++
        }
      }

      return NextResponse.json({
        success: true,
        sent: sentCount,
        errors: errorCount,
        message: `Odesláno ${sentCount} newsletterů, ${errorCount} chyb`,
      })
    }

    // Send specific campaign
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    const campaign = await getNewsletterCampaign(campaignId)
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status === 'sent') {
      return NextResponse.json(
        { error: 'Campaign already sent' },
        { status: 400 }
      )
    }

    const subscribers = await getNewsletterSubscribers()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
    const unsubscribeUrl = `${siteUrl}/unsubscribe`

    const emailHtml = renderNewsletterEmail(campaign.description || '', campaign.sections, siteUrl, unsubscribeUrl)

    // Send to all subscribers
    const emailPromises = subscribers.map((subscriber) =>
      resend.emails.send({
        from: 'Matěj Mauler <matej@mail.ziju.life>',
        to: subscriber.email,
        subject: campaign.subject,
        html: emailHtml,
      })
    )

    await Promise.all(emailPromises)
    await markCampaignAsSent(campaignId)

    return NextResponse.json({
      success: true,
      sent: subscribers.length,
      message: `Newsletter odeslán ${subscribers.length} odběratelům`,
    })
  } catch (error: any) {
    console.error('Error sending newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
