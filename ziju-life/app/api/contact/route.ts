import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Funkce pro skloňování jména ve vokativu (5. pád)
function getVocative(name: string): string {
  if (!name || name.length === 0) return name

  const trimmedName = name.trim()
  const lowerName = trimmedName.toLowerCase()

  // Speciální případy
  const specialCases: Record<string, string> = {
    'matěj': 'Matěji',
    'petr': 'Petře',
    'pavel': 'Pavle',
    'tomáš': 'Tomáši',
    'jakub': 'Jakube',
    'lukáš': 'Lukáši',
    'ondřej': 'Ondřeji',
    'david': 'Davide',
    'daniel': 'Danieli',
    'martin': 'Martine',
    'jan': 'Jane',
    'josef': 'Josefe',
    'karel': 'Karle',
    'vít': 'Víte',
    'filip': 'Filipe',
    'adam': 'Adame',
    'marek': 'Marku',
    'michal': 'Michale',
    'ondra': 'Ondro',
    'jirka': 'Jirko',
    'honza': 'Honzo',
    'pepa': 'Pepo',
    'kuba': 'Kubo',
  }

  if (specialCases[lowerName]) {
    // Vždy vrátíme s velkým prvním písmenem
    return specialCases[lowerName]
  }

  // Obecná pravidla
  const lastChar = lowerName[lowerName.length - 1]
  const secondLastChar = lowerName.length > 1 ? lowerName[lowerName.length - 2] : ''

  // Jména končící na -a (většinou ženská nebo zdrobněliny)
  if (lastChar === 'a' && secondLastChar !== 'i' && secondLastChar !== 'y') {
    const base = trimmedName.slice(0, -1).toLowerCase()
    return base.charAt(0).toUpperCase() + base.slice(1) + 'o'
  }

  // Jména končící na -e
  if (lastChar === 'e') {
    const base = trimmedName.slice(0, -1).toLowerCase()
    return base.charAt(0).toUpperCase() + base.slice(1) + 'i'
  }

  // Jména končící na souhlásku (většina mužských jmen)
  const consonants = 'bcčdďfghjklmnňpqrřsštťvwxzž'
  if (consonants.includes(lastChar)) {
    // Pokud končí na -ek, -ík, -ák -> změníme na -ku, -íku, -áku
    if (lowerName.endsWith('ek')) {
      const base = trimmedName.slice(0, -2).toLowerCase()
      return base.charAt(0).toUpperCase() + base.slice(1) + 'ku'
    }
    if (lowerName.endsWith('ík')) {
      const base = trimmedName.slice(0, -2).toLowerCase()
      return base.charAt(0).toUpperCase() + base.slice(1) + 'íku'
    }
    if (lowerName.endsWith('ák')) {
      const base = trimmedName.slice(0, -2).toLowerCase()
      return base.charAt(0).toUpperCase() + base.slice(1) + 'áku'
    }
    // Jinak přidáme -e
    const base = trimmedName.toLowerCase()
    return base.charAt(0).toUpperCase() + base.slice(1) + 'e'
  }

  // Pokud nic neplatí, vrátíme původní jméno s velkým prvním písmenem
  return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, message } = body

    // Validace povinných polí
    if (!firstName || !email) {
      return NextResponse.json(
        { error: 'Jméno a email jsou povinné' },
        { status: 400 }
      )
    }

    // Ověření, že máme potřebné environment proměnné
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY není nastaveno')
      return NextResponse.json(
        { error: 'Chyba konfigurace serveru' },
        { status: 500 }
      )
    }

    const recipientEmail = process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL
    if (!recipientEmail) {
      console.error('CONTACT_EMAIL nebo RESEND_FROM_EMAIL není nastaveno')
      return NextResponse.json(
        { error: 'Chyba konfigurace serveru' },
        { status: 500 }
      )
    }

    // Sestavení emailu
    const emailSubject = `Nová zpráva z koučink formuláře od ${firstName}${lastName ? ` ${lastName}` : ''}`
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #E8871E; padding-bottom: 10px;">
          Nová zpráva z koučink formuláře
        </h2>
        
        <div style="margin-top: 20px;">
          <p><strong>Jméno:</strong> ${firstName}${lastName ? ` ${lastName}` : ''}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
        </div>
        
        ${message ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <strong>Zpráva:</strong>
            <p style="margin-top: 10px; white-space: pre-wrap;">${message}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Odesláno: ${new Date().toLocaleString('cs-CZ')}</p>
        </div>
      </div>
    `

    // Skloňování jména ve vokativu
    const vocativeName = getVocative(firstName)

    // Odeslání emailu uživateli (potvrzovací email)
    const confirmationEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #E8871E; padding-bottom: 10px;">
          Děkuji za vyplnění formuláře
        </h2>
        
        <div style="margin-top: 20px;">
          <p>Ahoj ${vocativeName},</p>
          <p>Děkuji ti za vyplnění formuláře a tvůj zájem o koučing. Ozvu se ti hned, jak to bude možné.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>S pozdravem,<br />Matěj</p>
        </div>
      </div>
    `

    const confirmationResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Děkuji za tvůj zájem o koučing',
      html: confirmationEmailHtml,
    })

    if (confirmationResult.error) {
      console.error('Resend confirmation email error:', confirmationResult.error)
    }

    // Odeslání emailu na kontaktní adresu (notifikační email)
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: recipientEmail,
      replyTo: email,
      subject: emailSubject,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Chyba při odesílání emailu' },
        { status: 500 }
      )
    }

    console.log('Emaily úspěšně odeslány:', { notification: data, confirmation: confirmationResult.data })

    return NextResponse.json(
      { success: true, message: 'Zpráva byla úspěšně odeslána' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Chyba při odesílání zprávy' },
      { status: 500 }
    )
  }
}
