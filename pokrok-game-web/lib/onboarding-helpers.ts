import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function initializeOnboardingSteps(userId: string, locale: string = 'cs'): Promise<void> {
  try {
    console.log('🔄 Starting onboarding steps initialization for user:', userId, 'locale:', locale)
    
    // Check if user already has onboarding area "Začínáme" or "Getting Started"
    const existingArea = await sql`
      SELECT id FROM areas 
      WHERE user_id = ${userId} 
      AND (name = 'Začínáme' OR name = 'Getting Started')
      LIMIT 1
    `
    
    if (existingArea.length > 0) {
      // User already has onboarding area, check if they have steps
      const existingSteps = await sql`
        SELECT id FROM daily_steps 
        WHERE user_id = ${userId} 
        AND area_id = ${existingArea[0].id}
        LIMIT 1
      `
      
      if (existingSteps.length > 0) {
        // User already has onboarding steps, skip creation
        console.log('⏭️ User already has onboarding steps, skipping creation')
        return
      }
    }

    const isEnglish = locale === 'en'
    console.log('📝 Creating onboarding content, isEnglish:', isEnglish)

    // Create onboarding area "Začínáme"
    const areaId = randomUUID()
    const areaName = isEnglish ? 'Getting Started' : 'Začínáme'
    const areaDescription = isEnglish 
      ? 'Learn how to use Pokrok' 
      : 'Naučte se, jak používat Pokrok'
    
    console.log('🏗️ Creating area:', areaName, 'with ID:', areaId)
    await sql`
      INSERT INTO areas (id, user_id, name, description, color, icon, "order")
      VALUES (
        ${areaId}, 
        ${userId}, 
        ${areaName}, 
        ${areaDescription}, 
        '#3B82F6', 
        'HelpCircle', 
        0
      )
    `
    console.log('✅ Area created successfully')

    // Create goal "Naučit se s aplikací" in this area
    const goalId = randomUUID()
    const goalName = isEnglish ? 'Learn to use the app' : 'Naučit se s aplikací'
    
    console.log('🎯 Creating goal:', goalName, 'with ID:', goalId)
    await sql`
      INSERT INTO goals (
        id, user_id, title, description, status, priority, category, goal_type, progress_percentage, icon, area_id
      ) VALUES (
        ${goalId},
        ${userId},
        ${goalName},
        ${goalName},
        'active',
        'meaningful',
        'medium-term',
        'outcome',
        0,
        'HelpCircle',
        ${areaId}
      )
    `
    console.log('✅ Goal created successfully')

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Create 7 onboarding steps with today's date
    const steps = [
      {
        title: isEnglish ? '1/7 Create area' : '1/7 Vytvořit oblast',
        description: isEnglish 
          ? 'Click the + button in the left navigation menu to create a new area' 
          : 'Klikněte na tlačítko + v levém navigačním menu pro vytvoření nové oblasti',
        date: today,
        estimated_time: 3,
        goal_id: goalId
      },
      {
        title: isEnglish ? '2/7 Create goal' : '2/7 Vytvořit cíl',
        description: isEnglish 
          ? 'Click the + button in the left navigation menu to create a new goal' 
          : 'Klikněte na tlačítko + v levém navigačním menu pro vytvoření nového cíle',
        date: today,
        estimated_time: 3,
        goal_id: goalId
      },
      {
        title: isEnglish ? '3/7 Create step' : '3/7 Vytvořit krok',
        description: isEnglish 
          ? 'Click the + button in the left navigation menu to create a new step' 
          : 'Klikněte na tlačítko + v levém navigačním menu pro vytvoření nového kroku',
        date: today,
        estimated_time: 3,
        goal_id: goalId
      },
      {
        title: isEnglish ? '4/7 Create habit' : '4/7 Vytvořit návyk',
        description: isEnglish 
          ? 'Click the + button in the left navigation menu to create a new habit' 
          : 'Klikněte na tlačítko + v levém navigačním menu pro vytvoření nového návyku',
        date: today,
        estimated_time: 3,
        goal_id: goalId
      },
      {
        title: isEnglish 
          ? '5/7 Use the Upcoming, Overview, and Statistics views' 
          : '5/7 Použijte zobrazení Nadcházející, Přehled a Statistiky',
        description: isEnglish 
          ? 'Upcoming shows your tasks for today and future. Overview provides a summary of your progress. Statistics show detailed analytics of your activities.' 
          : 'Nadcházející zobrazuje vaše úkoly na dnes a do budoucna. Přehled poskytuje souhrn vašeho pokroku. Statistiky zobrazují detailní analýzu vašich aktivit.',
        date: today,
        estimated_time: 5,
        goal_id: goalId
      },
      {
        title: isEnglish 
          ? '6/7 Explore the Areas view' 
          : '6/7 Prozkoumejte zobrazení Oblastí',
        description: isEnglish 
          ? 'The Areas view groups your goals and steps by areas, helping you organize your work by different life domains.' 
          : 'Zobrazení Oblastí seskupuje vaše cíle a kroky podle oblastí, což vám pomáhá organizovat práci podle různých životních domén.',
        date: today,
        estimated_time: 5,
        goal_id: goalId
      },
      {
        title: isEnglish 
          ? '7/7 Explore the Help section' 
          : '7/7 Prozkoumejte sekci Nápověda',
        description: isEnglish 
          ? 'The Help section is in the left navigation menu. There you will find detailed information on how the application works.' 
          : 'Sekce Nápověda je v levém navigačním menu. Tam najdete podrobné informace o tom, jak aplikace funguje.',
        date: today,
        estimated_time: 5,
        goal_id: goalId
      }
    ]

    // Create steps
    console.log('📋 Creating', steps.length, 'onboarding steps')
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepId = randomUUID()
      console.log(`  Creating step ${i + 1}/${steps.length}:`, step.title)
      await sql`
        INSERT INTO daily_steps (
          id, user_id, title, description, date, completed, area_id, goal_id, estimated_time, created_at, updated_at
        ) VALUES (
          ${stepId},
          ${userId},
          ${step.title},
          ${step.description},
          ${step.date}::date,
          false,
          ${areaId},
          ${step.goal_id},
          ${step.estimated_time},
          NOW(),
          NOW()
        )
      `
    }
    console.log('✅ All onboarding steps created successfully')
    console.log('🎉 Onboarding initialization completed for user:', userId)
  } catch (error) {
    console.error('❌ Error initializing onboarding steps:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    // Don't throw - allow user creation to succeed even if onboarding init fails
    throw error // Re-throw to see the error in the caller
  }
}
