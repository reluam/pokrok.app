import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const from = `Matěj z Žiju.life <${fromEmail}>`

const ACCENT = '#FF8C42'
const TEXT_DARK = '#171717'
const TEXT_MUTED = '#666666'
const BORDER = '#e5e5e5'
const BOX_BG = '#f5f5f5'

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://ziju.life'
}

function emailWrapper(title: string, content: string): string {
  const siteUrl = getSiteUrl()
  const logoUrl = `${siteUrl}/ziju-life-logo.png`
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background-color: #ffffff;">
              <a href="${siteUrl}" style="display: inline-block; text-decoration: none; border: 0;">
                <img src="${logoUrl}" alt="Žiju life" width="200" height="80" style="max-width: 200px; width: 200px; height: auto; display: block; margin: 0 auto; border: 0; outline: none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px; text-align: center; border-bottom: 1px solid ${BORDER};">
              <h1 style="color: ${TEXT_DARK}; font-size: 24px; font-weight: bold; margin: 0; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #ffffff; border-top: 1px solid ${BORDER};">
              <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Žiju life · ${siteUrl.replace(/^https?:\/\//, '')}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function sendAuditZivotaAccessEmail(
  to: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn('[user-email] RESEND_API_KEY not set, skipping audit access email')
    return { ok: false, error: 'Resend not configured' }
  }

  const siteUrl = getSiteUrl()
  const next = encodeURIComponent('/tvoje-mapa')
  const accessUrl = `${siteUrl}/api/auth/verify?token=${encodeURIComponent(token)}&next=${next}`

  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      Ahoj,
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
      Platba proběhla úspěšně — Tvoje mapa je tvoje!
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
      Klikni na tlačítko níže a dostaneš se přímo do průvodce.
      Odkaz je platný <strong>5 minut</strong>.
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${accessUrl}" target="_blank" rel="noreferrer"
         style="display: inline-block; padding: 14px 32px; border-radius: 999px; background-color: ${ACCENT}; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; letter-spacing: 0.01em;">
        Otevřít Tvoje mapa →
      </a>
    </div>

    <div style="padding: 16px 20px; background-color: ${BOX_BG}; border-radius: 8px; margin-bottom: 24px;">
      <p style="color: ${TEXT_MUTED}; font-size: 13px; line-height: 1.6; margin: 0;">
        Nebo zkopíruj tento odkaz do prohlížeče:<br>
        <span style="font-family: monospace; font-size: 12px; word-break: break-all; color: ${TEXT_DARK};">${accessUrl}</span>
      </p>
    </div>

    <p style="color: ${TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0;">
      Odkaz je jednorázový. Pokud vyprší, přihlas se přes <a href="${siteUrl}/ucet" style="color: ${ACCENT}; text-decoration: none;">svůj účet</a> a průvodce najdeš v sekci Moje produkty.
    </p>
  `

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: 'Tvoje mapa — tvůj přístup je ready',
      html: emailWrapper('Platba proběhla!', content),
    })
    if (error) {
      console.warn('[user-email] Audit access email send failed:', error)
      return { ok: false, error: String(error) }
    }
    return { ok: true }
  } catch (err) {
    console.warn('[user-email] sendAuditZivotaAccessEmail error:', err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function sendMagicLinkEmail(
  to: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn('[user-email] RESEND_API_KEY not set, skipping magic link email')
    return { ok: false, error: 'Resend not configured' }
  }

  const siteUrl = getSiteUrl()
  const loginUrl = `${siteUrl}/api/auth/verify?token=${encodeURIComponent(token)}`

  const content = `
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Ahoj,
    </p>
    <p style="color: ${TEXT_DARK}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
      Klikni na tlačítko níže a přihlásíš se do svého účtu na Žiju.life.
      Odkaz je platný <strong>5 minut</strong>.
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${loginUrl}" target="_blank" rel="noreferrer"
         style="display: inline-block; padding: 14px 32px; border-radius: 999px; background-color: ${ACCENT}; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; letter-spacing: 0.01em;">
        Přihlásit se
      </a>
    </div>

    <div style="padding: 16px 20px; background-color: ${BOX_BG}; border-radius: 8px; margin-bottom: 24px;">
      <p style="color: ${TEXT_MUTED}; font-size: 13px; line-height: 1.6; margin: 0;">
        Nebo zkopíruj tento odkaz do prohlížeče:<br>
        <span style="font-family: monospace; font-size: 12px; word-break: break-all; color: ${TEXT_DARK};">${loginUrl}</span>
      </p>
    </div>

    <p style="color: ${TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0;">
      Pokud ses o přihlášení nepokusil/a, tento e-mail ignoruj.
    </p>
  `

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: 'Přihlášení do Žiju.life',
      html: emailWrapper('Přihlášení do účtu', content),
    })
    if (error) {
      console.warn('[user-email] Magic link send failed:', error)
      return { ok: false, error: String(error) }
    }
    return { ok: true }
  } catch (err) {
    console.warn('[user-email] sendMagicLinkEmail error:', err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
