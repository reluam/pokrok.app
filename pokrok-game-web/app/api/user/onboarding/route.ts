import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, updateUserOnboardingStatus } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[Onboarding] PUT request for user:', dbUser.id, 'current has_completed_onboarding:', dbUser.has_completed_onboarding)

    const body = await request.json().catch(() => ({}))
    const hasCompletedOnboarding = body.hasCompletedOnboarding !== undefined 
      ? body.hasCompletedOnboarding 
      : true
    
    console.log('[Onboarding] hasCompletedOnboarding from request:', hasCompletedOnboarding)

    // If user hasn't completed onboarding yet, initialize onboarding steps
    if (!dbUser.has_completed_onboarding && hasCompletedOnboarding) {
      try {
        console.log('[Onboarding] Starting initialization for user:', dbUser.id)
        
        // Check if user already has onboarding steps
        const existingSteps = await sql`
          SELECT id FROM daily_steps 
          WHERE user_id = ${dbUser.id} 
          AND (title LIKE 'Jak si%' OR title LIKE 'How to%')
          LIMIT 1
        `
        
        console.log('[Onboarding] Existing steps check:', existingSteps.length)
        
        if (existingSteps.length === 0) {
          // Get user's locale - try user_settings first, fallback to 'cs'
          let locale = 'cs'
          let isEnglish = false
          
          try {
            const userSettings = await sql`
              SELECT locale FROM user_settings WHERE user_id = ${dbUser.id}
            `
            if (userSettings && userSettings.length > 0 && userSettings[0]?.locale) {
              locale = userSettings[0].locale
            }
          } catch (settingsError) {
            console.log('[Onboarding] Could not fetch user settings, using default locale:', settingsError)
          }
          
          isEnglish = locale === 'en'
          console.log('[Onboarding] Using locale:', locale, 'isEnglish:', isEnglish)

          // Create one onboarding area
          const areaId = crypto.randomUUID()
          const areaName = isEnglish ? 'Getting Started' : 'Začínáme'
          const areaDescription = isEnglish 
            ? 'Learn how to use Pokrok' 
            : 'Naučte se, jak používat Pokrok'
          
          console.log('[Onboarding] Creating area:', areaName, 'with ID:', areaId)
          
          const areaResult = await sql`
            INSERT INTO areas (id, user_id, name, description, color, icon, "order")
            VALUES (
              ${areaId}, 
              ${dbUser.id}, 
              ${areaName}, 
              ${areaDescription}, 
              '#3B82F6', 
              'HelpCircle', 
              0
            ) RETURNING id
          `
          
          console.log('[Onboarding] Area created:', areaResult[0]?.id)

          // Get today's date
          const today = new Date().toISOString().split('T')[0]
          console.log('[Onboarding] Using date:', today)

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
          console.log('[Onboarding] Creating', steps.length, 'steps')
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i]
            const stepId = crypto.randomUUID()
            console.log('[Onboarding] Creating step', i + 1, ':', step.title)
            
            try {
              const stepResult = await sql`
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
                ) RETURNING id
              `
              console.log('[Onboarding] Step created:', stepResult[0]?.id)
            } catch (stepError) {
              console.error('[Onboarding] Error creating step', i + 1, ':', stepError)
              throw stepError // Re-throw to be caught by outer catch
            }
          }
          
          console.log('[Onboarding] Successfully initialized', steps.length, 'steps for user:', dbUser.id)
        } else {
          console.log('[Onboarding] User already has onboarding steps, skipping creation')
        }
      } catch (initError) {
        console.error('[Onboarding] Error initializing onboarding steps:', initError)
        console.error('[Onboarding] Error details:', {
          message: initError instanceof Error ? initError.message : String(initError),
          stack: initError instanceof Error ? initError.stack : undefined,
          userId: dbUser.id
        })
        // Continue anyway - don't block onboarding completion
      }
    } else {
      console.log('[Onboarding] Skipping initialization - user already completed onboarding or hasCompletedOnboarding is false')
    }

    await updateUserOnboardingStatus(dbUser.id, hasCompletedOnboarding)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
