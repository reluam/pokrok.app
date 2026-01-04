import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { createUser, createArea } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    // Support both auth-based and clerkId query param
    const { searchParams } = new URL(request.url)
    const clerkIdParam = searchParams.get('clerkId')
    
    if (clerkIdParam) {
      // If clerkId is provided, use it (for backward compatibility)
      const { getUserByClerkId } = await import('@/lib/cesta-db')
      const user = await getUserByClerkId(clerkIdParam)
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      return NextResponse.json(user)
    } else {
      // Otherwise, use auth-based approach
      const authResult = await requireAuth(request)
      if (authResult instanceof NextResponse) return authResult
      const { dbUser } = authResult

      // ✅ SECURITY: Vrátit pouze data autentizovaného uživatele
      return NextResponse.json(dbUser)
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { clerkUserId, dbUser } = authResult

    // ✅ SECURITY: Pokud uživatel existuje, vrátit ho místo vytváření nového
    if (dbUser) {
      return NextResponse.json(dbUser)
    }

    const body = await request.json()
    const { email, firstName, lastName } = body
    
    // Use email or construct from other fields
    const userEmail = email || `${clerkUserId}@example.com`
    // Construct name from firstName and lastName, or use email username as fallback
    const name = [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'User'

    // ✅ SECURITY: Použít clerkUserId z autentizace, ne z body
    const user = await createUser(clerkUserId, userEmail, name)
    
    // Create onboarding steps immediately after user creation
    try {
      console.log('[User Creation] Creating onboarding steps for new user:', user.id)
      
      // Get user's locale - default to 'cs'
      let locale = 'cs'
      let isEnglish = false
      
      try {
        const userSettings = await sql`
          SELECT locale FROM user_settings WHERE user_id = ${user.id}
        `
        if (userSettings && userSettings.length > 0 && userSettings[0]?.locale) {
          locale = userSettings[0].locale
        }
      } catch (settingsError) {
        console.log('[User Creation] Could not fetch user settings, using default locale:', settingsError)
      }
      
      isEnglish = locale === 'en'
      console.log('[User Creation] Using locale:', locale)

      // Create one onboarding area
      const areaId = crypto.randomUUID()
      const areaName = isEnglish ? 'Getting Started' : 'Začínáme'
      const areaDescription = isEnglish 
        ? 'Learn how to use Pokrok' 
        : 'Naučte se, jak používat Pokrok'
      
      console.log('[User Creation] Creating area:', areaName)
      
      await sql`
        INSERT INTO areas (id, user_id, name, description, color, icon, "order")
        VALUES (
          ${areaId}, 
          ${user.id}, 
          ${areaName}, 
          ${areaDescription}, 
          '#3B82F6', 
          'HelpCircle', 
          0
        )
      `

      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      console.log('[User Creation] Using date:', today)

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
      console.log('[User Creation] Creating', steps.length, 'steps')
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const stepId = crypto.randomUUID()
        console.log('[User Creation] Creating step', i + 1, ':', step.title)
        
        await sql`
          INSERT INTO daily_steps (
            id, user_id, title, description, date, completed, area_id, created_at, updated_at
          ) VALUES (
            ${stepId},
            ${user.id},
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
      
      console.log('[User Creation] Successfully created onboarding steps for user:', user.id)
    } catch (onboardingError) {
      console.error('[User Creation] Error creating onboarding steps:', onboardingError)
      // Don't fail user creation if onboarding steps fail
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: errorMessage 
    }, { status: 500 })
  }
}
