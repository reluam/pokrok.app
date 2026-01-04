import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

/**
 * Creates onboarding area, goal, and steps for a new user
 * @param userId The user ID
 * @param locale The locale ('cs' or 'en')
 */
export async function createOnboardingItems(userId: string, locale: string = 'cs'): Promise<void> {
  const isEnglish = locale === 'en'
  
  console.log('[Onboarding] Creating onboarding items for user:', userId, 'locale:', locale)
  
  try {
    // Create onboarding area
    const areaId = crypto.randomUUID()
    const areaName = isEnglish ? 'Getting Started' : 'Začínáme'
    const areaDescription = isEnglish 
      ? 'Learn how to use Pokrok' 
      : 'Naučte se, jak používat Pokrok'
    
    const areaResult = await sql`
      INSERT INTO areas (id, user_id, name, description, color, icon, "order")
      VALUES (
        ${areaId}, 
        ${userId}, 
        ${areaName}, 
        ${areaDescription}, 
        '#3B82F6', 
        'HelpCircle', 
        0
      ) RETURNING id
    `
    
    console.log('[Onboarding] Onboarding area created:', areaResult[0]?.id)

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
        ${userId}, 
        ${goalTitle}, 
        ${goalDescription}, 
        'active',
        'meaningful', 
        'medium-term', 
        'outcome', 
        0, 
        'Laptop', 
        ${areaId}
      ) RETURNING id
    `
    
    console.log('[Onboarding] Onboarding goal created:', goalResult[0]?.id)

    // Get today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Create onboarding steps - all for today, assigned to the goal
    const steps = [
      {
        title: isEnglish ? '1/7 Create an area' : '1/7 Vytvořit oblast',
        description: isEnglish
          ? 'Click on the "Add" button in the left navigation menu and select "Area". Give your area a name, color, and icon.'
          : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Oblast". Pojmenujte oblast, vyberte barvu a ikonu.',
        date: todayStr,
        isImportant: true
      },
      {
        title: isEnglish ? '2/7 Create a goal' : '2/7 Vytvořit cíl',
        description: isEnglish
          ? 'Click on the "Add" button in the left navigation menu and select "Goal". Add a title, description, and steps to your goal.'
          : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Cíl". Přidejte název, popis a kroky k vašemu cíli.',
        date: todayStr,
        isImportant: true
      },
      {
        title: isEnglish ? '3/7 Create a step' : '3/7 Vytvořit krok',
        description: isEnglish 
          ? 'Click on the "Add" button in the left navigation menu and select "Step". Fill in the step details and save.'
          : 'Klikněte na tlačítko "Přidat" v levém navigačním menu a vyberte "Krok". Vyplňte údaje o kroku a uložte.',
        date: todayStr,
        isImportant: true
      },
      {
        title: isEnglish ? '4/7 Create a habit' : '4/7 Vytvořit návyk',
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
    console.log('[Onboarding] Creating', steps.length, 'onboarding steps...')
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepId = crypto.randomUUID()
      
      try {
        await sql`
          INSERT INTO daily_steps (
            id, user_id, title, description, date, completed, area_id, goal_id, is_important, created_at, updated_at
          ) VALUES (
            ${stepId},
            ${userId},
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
        console.log('[Onboarding] Created step', i + 1, ':', step.title)
      } catch (stepError) {
        console.error('[Onboarding] Error creating step', i + 1, ':', stepError)
        if (stepError instanceof Error) {
          console.error('[Onboarding] Step error message:', stepError.message)
        }
        throw stepError // Re-throw to be caught by outer catch
      }
    }
    
    console.log('[Onboarding] Successfully created onboarding area, goal and', steps.length, 'steps for user:', userId)
  } catch (error) {
    console.error('[Onboarding] Error creating onboarding items:', error)
    if (error instanceof Error) {
      console.error('[Onboarding] Error message:', error.message)
      console.error('[Onboarding] Error stack:', error.stack)
    }
    // Don't throw - allow user creation to succeed even if onboarding items fail
    // User can still use the app
  }
}

