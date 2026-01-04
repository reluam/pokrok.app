import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { createUser } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    // Support both auth-based and clerkId query param
    const { searchParams } = new URL(request.url)
    const clerkIdParam = searchParams.get('clerkId')
    
    if (clerkIdParam) {
      // If clerkId is provided, use it (for backward compatibility)
      const { getUserByClerkId } = await import('@/lib/cesta-db')
      console.log('[API/user] GET request with clerkId:', clerkIdParam)
      const user = await getUserByClerkId(clerkIdParam)
      console.log('[API/user] User found:', !!user, user ? `id: ${user.id}` : 'null')
      
      if (!user) {
        console.error('[API/user] User not found for clerkId:', clerkIdParam)
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
      console.log('[API/user] User already exists, returning existing user:', dbUser.id)
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
    console.log('[API/user] New user created:', user.id)
    
    // Get locale from NEXT_LOCALE cookie (set by user on unauthenticated page)
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
    console.log('[API/user] NEXT_LOCALE cookie:', localeCookie)
    const locale = (localeCookie === 'en' || localeCookie === 'cs') ? localeCookie : 'cs'
    const isEnglish = locale === 'en'
    
    console.log('[API/user] Creating onboarding steps for new user:', user.id, 'locale:', locale, 'isEnglish:', isEnglish)
    
    // Create onboarding area, goal and steps immediately after user creation
    try {
      const areaId = crypto.randomUUID()
      const areaName = isEnglish ? 'Getting Started' : 'Začínáme'
      const areaDescription = isEnglish 
        ? 'Learn how to use Pokrok' 
        : 'Naučte se, jak používat Pokrok'
      
      const areaResult = await sql`
        INSERT INTO areas (id, user_id, name, description, color, icon, "order")
        VALUES (
          ${areaId}, 
          ${user.id}, 
          ${areaName}, 
          ${areaDescription}, 
          '#3B82F6', 
          'HelpCircle', 
          0
        ) RETURNING id
      `
      
      console.log('[API/user] Onboarding area created:', areaResult[0]?.id)

      // Create onboarding goal
      const goalId = crypto.randomUUID()
      const goalTitle = isEnglish ? 'Learn to use the app' : 'Naučit se s aplikací'
      const goalDescription = isEnglish
        ? 'Complete these steps to learn how to use Pokrok'
        : 'Dokončete tyto kroky, abyste se naučili používat Pokrok'
      
      const goalResult = await sql`
        INSERT INTO goals (
          id, user_id, title, description, status, priority, 
          category, goal_type, progress_percentage, icon, area_id
        ) VALUES (
          ${goalId}, 
          ${user.id}, 
          ${goalTitle}, 
          ${goalDescription}, 
          'active',
          'meaningful', 
          'medium-term', 
          'outcome', 
          0, 
          'Target', 
          ${areaId}
        ) RETURNING id
      `
      
      console.log('[API/user] Onboarding goal created:', goalResult[0]?.id)

      // Get today's date
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      // Create onboarding steps - all for today, assigned to the goal
      const steps = [
        {
          title: isEnglish ? '1/7 How to create an area' : '1/7 Jak si založit oblast',
          description: isEnglish
            ? 'Click on the "Add" button in the left navigation menu and select "Area". Give your area a name, color, and icon.'
            : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Oblast". Pojmenujte oblast, vyberte barvu a ikonu.',
          date: todayStr,
          isImportant: true
        },
        {
          title: isEnglish ? '2/7 How to create a goal' : '2/7 Jak si založit cíl',
          description: isEnglish
            ? 'Click on the "Add" button in the left navigation menu and select "Goal". Add a title, description, and steps to your goal.'
            : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Cíl". Přidejte název, popis a kroky k vašemu cíli.',
          date: todayStr,
          isImportant: true
        },
        {
          title: isEnglish ? '3/7 How to create a step' : '3/7 Jak si založit nový krok',
          description: isEnglish 
            ? 'Click on the "Add" button in the left navigation menu and select "Step". Fill in the step details and save.'
            : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Krok". Vyplňte údaje o kroku a uložte.',
          date: todayStr,
          isImportant: true
        },
        {
          title: isEnglish ? '4/7 How to create a habit' : '4/7 Jak si založit návyk',
          description: isEnglish
            ? 'Click on the "Add" button in the left navigation menu and select "Habit". Set the frequency (daily, weekly, monthly) and start building your habit.'
            : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Návyk". Nastavte frekvenci (denně, týdně, měsíčně) a začněte budovat svůj návyk.',
          date: todayStr,
          isImportant: true
        },
        {
          title: isEnglish ? '5/7 Use Upcoming, Overview and Statistics views' : '5/7 Použijte zobrazení Upcoming, Overview a Statistiky',
          description: isEnglish
            ? 'Switch between "Upcoming" and "Overview" views in the left navigation, and check "Statistics" in the top menu to see your upcoming steps, an overview of all your goals, habits, and areas, and track your progress.'
            : 'Přepínejte mezi zobrazeními "Upcoming" a "Overview" v levém navigačním menu a podívejte se na "Statistiky" v horním menu, abyste viděli nadcházející kroky, přehled všech vašich cílů, návyků a oblastí a sledovali svůj pokrok.',
          date: todayStr,
          isImportant: false
        },
        {
          title: isEnglish ? '6/7 Explore Area views' : '6/7 Prozkoumejte zobrazení Oblastí',
          description: isEnglish
            ? 'Click on an area in the left navigation to see all goals, steps, and habits related to that area. Organize your work by areas.'
            : 'Klikněte na oblast v levém navigačním menu, abyste viděli všechny cíle, kroky a návyky související s touto oblastí. Organizujte svou práci podle oblastí.',
          date: todayStr,
          isImportant: false
        },
        {
          title: isEnglish ? '7/7 Explore Help section' : '7/7 Prozkoumejte sekci Nápověda',
          description: isEnglish
            ? 'Click on "Help" in the top navigation menu to learn more about all Pokrok features and get answers to common questions.'
            : 'Klikněte na "Nápověda" v horním navigačním menu a dozvíte se více o všech funkcích Pokroku a odpovědi na časté otázky.',
          date: todayStr,
          isImportant: false
        }
      ]

      // Create steps
      console.log('[API/user] Creating', steps.length, 'onboarding steps...')
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const stepId = crypto.randomUUID()
        
        try {
          await sql`
            INSERT INTO daily_steps (
              id, user_id, title, description, date, completed, area_id, goal_id, is_important, created_at, updated_at
            ) VALUES (
              ${stepId},
              ${user.id},
              ${step.title},
              ${step.description},
              ${step.date}::date,
              false,
              ${areaId},
              ${goalId},
              ${step.isImportant || false},
              NOW(),
              NOW()
            ) RETURNING id
          `
          console.log('[API/user] Created step', i + 1, ':', step.title)
        } catch (stepError) {
          console.error('[API/user] Error creating step', i + 1, ':', stepError)
          if (stepError instanceof Error) {
            console.error('[API/user] Step error message:', stepError.message)
          }
          throw stepError // Re-throw to be caught by outer catch
        }
      }
      
      console.log('[API/user] Successfully created onboarding area, goal and', steps.length, 'steps for user:', user.id)
    } catch (onboardingError) {
      console.error('[API/user] Error creating onboarding steps:', onboardingError)
      // Don't fail user creation if onboarding steps fail - user can still use the app
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
