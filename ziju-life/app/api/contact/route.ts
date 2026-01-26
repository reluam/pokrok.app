import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Funkce pro skloňování jména ve vokativu (5. pád) pomocí API
async function getVocative(name: string): Promise<string> {
  if (!name || name.length === 0) return name

  const trimmedName = name.trim()
  
  // Pokud není nastaven API klíč, použijeme fallback na původní jméno s velkým prvním písmenem
  const apiKey = process.env.SKLONOVANI_JMEN_API_KEY || 'klic' // 'klic' je testovací klíč
  
  try {
    // Volání API pro skloňování jmen
    // pad=5 = vokativ (5. pád)
    // pouzit-krestni=1 = použít křestní jméno
    // pouzit-osloveni=0 = nepoužít "pane/paní", jen jméno
    // format=json = JSON odpověď
    const apiUrl = `https://www.sklonovani-jmen.cz/api?klic=${encodeURIComponent(apiKey)}&pad=5&jmeno=${encodeURIComponent(trimmedName)}&pouzit-krestni=1&pouzit-osloveni=0&format=json`
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`)
    }
    
    const data = await response.json()
    
    // API vrací pole objektů s dotaz a odpoved
    if (Array.isArray(data) && data.length > 0 && data[0].odpoved) {
      // Odstraníme případné "pane/paní" z odpovědi (mělo by být odstraněno díky pouzit-osloveni=0, ale pro jistotu)
      let result = data[0].odpoved.trim()
      
      // Pokud obsahuje "pane " nebo "paní ", odstraníme to
      result = result.replace(/^(pane|paní)\s+/i, '')
      
      // Zajistíme velké první písmeno
      return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase()
    }
    
    // Pokud API nevrátilo správnou odpověď, použijeme fallback
    return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase()
  } catch (error) {
    console.error('Error calling sklonovani-jmen API:', error)
    // Fallback: vrátíme původní jméno s velkým prvním písmenem
    return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase()
  }
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

    // Skloňování jména ve vokativu pomocí API
    const vocativeName = await getVocative(firstName)

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
