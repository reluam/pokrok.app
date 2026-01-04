import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user already has onboarding steps
    const existingSteps = await sql`
      SELECT id FROM daily_steps 
      WHERE user_id = ${dbUser.id} 
      AND (title LIKE 'Jak si%' OR title LIKE 'How to%')
      LIMIT 1
    `
    
    if (existingSteps.length > 0) {
      // User already has onboarding steps, skip creation
      return NextResponse.json({ success: true, message: 'Onboarding steps already exist' })
    }

    // Get user's locale for creating localized steps
    const userSettings = await sql`
      SELECT locale FROM user_settings WHERE user_id = ${dbUser.id}
    `
    const locale = userSettings[0]?.locale || 'cs'
    const isEnglish = locale === 'en'

    // Create one onboarding area
    const areaId = crypto.randomUUID()
    const areaName = isEnglish ? 'Getting Started' : 'Začínáme'
    const areaDescription = isEnglish 
      ? 'Learn how to use Pokrok' 
      : 'Naučte se, jak používat Pokrok'
    
    await sql`
      INSERT INTO areas (id, user_id, name, description, color, icon, "order")
      VALUES (
        ${areaId}, 
        ${dbUser.id}, 
        ${areaName}, 
        ${areaDescription}, 
        '#3B82F6', 
        'HelpCircle', 
        0
      )
    `

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Create onboarding steps with today's date
    const steps = [
      {
        title: isEnglish ? 'How to create a step' : 'Jak si založit nový krok',
        description: isEnglish 
          ? 'Click on the "Add" button in the left navigation menu and select "Step". Fill in the step details and save.'
          : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Krok". Vyplňte údaje o kroku a uložte.',
        date: today
      },
      {
        title: isEnglish ? 'How to create a goal' : 'Jak si založit cíl',
        description: isEnglish
          ? 'Click on the "Add" button in the left navigation menu and select "Goal". Add a title, description, and steps to your goal.'
          : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Cíl". Přidejte název, popis a kroky k vašemu cíli.',
        date: today
      },
      {
        title: isEnglish ? 'How to create an area' : 'Jak si založit oblast',
        description: isEnglish
          ? 'Click on the "Add" button in the left navigation menu and select "Area". Give your area a name, color, and icon.'
          : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Oblast". Pojmenujte oblast, vyberte barvu a ikonu.',
        date: today
      },
      {
        title: isEnglish ? 'How to create a habit' : 'Jak si založit návyk',
        description: isEnglish
          ? 'Click on the "Add" button in the left navigation menu and select "Habit". Set the frequency (daily, weekly, monthly) and start building your habit.'
          : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Návyk". Nastavte frekvenci (denně, týdně, měsíčně) a začněte budovat svůj návyk.',
        date: today
      }
    ]

    // Create steps
    for (const step of steps) {
      const stepId = crypto.randomUUID()
      await sql`
        INSERT INTO daily_steps (
          id, user_id, title, description, date, completed, area_id, created_at, updated_at
        ) VALUES (
          ${stepId},
          ${dbUser.id},
          ${step.title},
          ${step.description},
          ${step.date}::date,
          false,
          ${areaId},
          NOW(),
          NOW()
        )
      `
    }

    return NextResponse.json({ 
      success: true, 
      areaId,
      stepsCreated: steps.length 
    })
  } catch (error) {
    console.error('Error initializing onboarding steps:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}

