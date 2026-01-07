import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

interface Tip {
  id: string
  title: string
  description: string
  category: 'motivation' | 'organization' | 'productivity' | 'feature'
  priority: number
}

interface AssistantContext {
  page: string
  section?: string
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const contextParam = searchParams.get('context')

    // Verify user owns the userId
    if (userId && userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUserId = userId || dbUser.id

    let context: AssistantContext = { page: 'main' }
    if (contextParam) {
      try {
        context = JSON.parse(contextParam)
      } catch (error) {
        console.error('Error parsing context:', error)
      }
    }

    // Get user statistics for personalized tips
    const [stepsResult, goalsResult, habitsResult, areasResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM daily_steps WHERE user_id = ${targetUserId}`,
      sql`SELECT COUNT(*) as count FROM goals WHERE user_id = ${targetUserId}`,
      sql`SELECT COUNT(*) as count FROM habits WHERE user_id = ${targetUserId}`,
      sql`SELECT COUNT(*) as count FROM areas WHERE user_id = ${targetUserId}`
    ])

    const completedStepsResult = await sql`
      SELECT COUNT(*) as count FROM daily_steps 
      WHERE user_id = ${targetUserId} AND completed = true
    `

    const activeGoalsResult = await sql`
      SELECT COUNT(*) as count FROM goals 
      WHERE user_id = ${targetUserId} AND status = 'active'
    `

    const stats = {
      totalSteps: parseInt(stepsResult[0]?.count || '0'),
      completedSteps: parseInt(completedStepsResult[0]?.count || '0'),
      totalGoals: parseInt(goalsResult[0]?.count || '0'),
      activeGoals: parseInt(activeGoalsResult[0]?.count || '0'),
      totalHabits: parseInt(habitsResult[0]?.count || '0'),
      totalAreas: parseInt(areasResult[0]?.count || '0')
    }

    // Check if user has completed onboarding
    const userResult = await sql`
      SELECT has_completed_onboarding FROM users WHERE id = ${targetUserId}
    `
    const hasCompletedOnboarding = userResult[0]?.has_completed_onboarding || false

    const tips: Tip[] = []

    // If user hasn't completed onboarding, show onboarding tips
    if (!hasCompletedOnboarding) {
      // Get locale from query params or default to 'cs'
      const localeParam = searchParams.get('locale')
      const locale = localeParam === 'en' ? 'en' : 'cs'
      
      // Return onboarding tips - show all tips on all pages
      const onboardingTips = [
        {
          id: 'onboarding-intro',
          title: locale === 'cs' ? 'Vítejte v Pokroku!' : 'Welcome to Pokrok!',
          description: locale === 'cs' 
            ? 'Pokrok je aplikace navržená pro sledování pokroku v životních snech a cílech. Aplikace jako taková je v podstatě podpůrná berle a motivace pro setrvání.'
            : 'Pokrok is an application designed for tracking progress in life dreams and goals. The application itself is essentially a support crutch and motivation for persistence.',
          category: 'feature' as const,
          priority: 10
        },
        {
          id: 'onboarding-assistant',
          title: locale === 'cs' ? 'Funkce asistenta' : 'This assistant',
          description: locale === 'cs'
            ? 'Asistent slouží k tomu, abyste mohli rychle cokoliv dohledat a k tomu, aby vám pomáhal různými tipy založenými na tom, jak aplikaci používáte. Ze začátku bude asistent poskytovat hlavně obecné tipy, ale postupem času vám bude pomáhat konkrétněji a praktičtěji. Asistenta můžete kdykoliv vypnout v Nastavení.'
            : 'This assistant serves to help you quickly find anything and to help you with various tips based on how you use the application. Initially, this assistant will provide mainly general tips, but over time it will help you more specifically and practically. This assistant can be turned off at any time in Settings.',
          category: 'feature' as const,
          priority: 9
        },
        {
          id: 'onboarding-setup',
          title: locale === 'cs' ? 'Nastavení aplikace' : 'Application setup',
          description: locale === 'cs'
            ? 'Pro správné fungování aplikace byste měli nastavit své cíle, ideálně i oblasti a na základě toho potom i jednotlivé kroky a návyky.'
            : 'For the application to work properly, you must set up your goals, ideally also areas, and based on that, then individual steps and habits.',
          category: 'organization' as const,
          priority: 8
        },
        {
          id: 'onboarding-goals',
            title: locale === 'cs' ? 'Cíle' : 'Goals',
            description: locale === 'cs'
              ? '**Kde najít cíle**\n\nCíle najdete v levém navigačním menu. Můžete kliknout na konkrétní cíl v **Oblasti**, nebo na stránku **Cíle**, kde jsou všechny cíle seřazeny. Cíle se tvoří kliknutím na tlačítko **Přidat** v levém navigačním menu úplně dole.\n\n**Vytvoření cíle podle SMART**\n\nPři vytváření cíle můžete použít metodu SMART k vytvoření Specifického (konkrétní cíl), Měřitelného (jak ho budete měřit), Ambiciózního, Realistického a Časově vymezeného cíle.\n\nPro měřitelnost můžete v aplikaci použít metriky, které nastavíte po vytvoření cíle.'
              : '**Where to find goals**\n\nYou can find goals in the left navigation menu. You can click on a specific goal in an **Area**, or on the **Goals** page where all goals are listed. Goals are created by clicking the **Add** button at the bottom of the left navigation menu.\n\n**Creating a goal using SMART method**\n\nWhen creating a goal, you can use the SMART method to create a Specific (specific goal), Measurable (how are you going to measure it), Ambitious, Realistic, Time-bound goal.\n\nFor measurable you can use metrics when creating the goal, which will help you track the progress more easily.',
          category: 'productivity' as const,
          priority: 7
        },
        {
          id: 'onboarding-areas',
            title: locale === 'cs' ? 'Oblasti' : 'Areas',
            description: locale === 'cs'
              ? 'Oblast můžete přidat v hlavním panelu kliknutím na **Přidat** a poté výběrem **Oblast**. Do oblasti můžete přiřadit kolik chcete cílů. Oblasti vlastně akorát seskupují jednotlivé cíle do logických celků pro přehled a filtrování.\n\nOblasti můžou být životní oblasti, vize nebo velké projekty.'
              : 'You can add an area in the main panel by clicking **Add**, and then selecting **Area**. You can assign as many goals as you want to an area. Areas essentially group individual goals into logical units for overview and filtering.\n\nAreas can be life areas, visions, or large projects.',
          category: 'organization' as const,
          priority: 5
        },
        {
          id: 'onboarding-steps',
            title: locale === 'cs' ? 'Kroky' : 'Steps',
            description: locale === 'cs'
              ? '**Co jsou kroky**\n\nKroky jsou to-do úkoly zamýšlené jako kroky pro cíle. Kroky jsou spolu s návyky ta každodenní práce, kterou musíte udělat, abyste se posunuli k tomu životu, který chcete.\n\n**Kde nastavit kroky**\n\nKroky můžete přidat v navigačním panelu dole přes tlačítko **Přidat**, ale také nahoře vpravo v sekci **Nadcházející**, nebo přímo u konkrétního cíle.\n\n**Checklisty u kroků**\n\nKe krokům se dají přidat checklisty v detailu kroku - což jsou položky, které je třeba splnit pro krok a umožňují mít větší kontrolu nad tím, co se děje.\n\n**Opakující se kroky**\n\nOpakující se kroky jsou kroky, které se budou automaticky opakovat s určitou periodou (nastavíte vy) a vždy se zobrazí pouze jeden nejbližší výskyt toho kroku. Dokud není splněný, nezobrazí se další.'
              : '**What are steps**\n\nSteps are to-do tasks intended as steps for goals. These are, together with habits, the daily work you will do to actually move towards the life you want.\n\n**Where to set up steps**\n\nYou can add steps in the bottom navigation panel on the **Add** button, but also at the top in **Upcoming** or in a goal in the steps section.\n\n**Checklists for steps**\n\nChecklists can be added to steps in the step detail - these are items that need to be completed for a step and allow for better control over what is happening.\n\n**Recurring steps**\n\nRecurring steps are steps that will automatically repeat with a certain period (you set it) and only one nearest occurrence of that step will be displayed. Until it is completed, the next one will not be displayed.',
          category: 'productivity' as const,
          priority: 4
        },
        {
          id: 'onboarding-habits',
            title: locale === 'cs' ? 'Návyky' : 'Habits',
            description: locale === 'cs'
              ? 'Návyky slouží k vybudování zdravých, případně odstranění škodlivých návyků. Nastavení najdete v **Návycích** a samotné návyky se poté podle frekvence budou zobrazovat v sekci **Nadcházející**.'
              : 'Habits serve to build healthy habits, or remove harmful ones. Settings can be found in **Habits** and the habits themselves will then be displayed according to frequency in the **Upcoming** view.',
          category: 'productivity' as const,
          priority: 0
        },
        {
          id: 'onboarding-contact',
            title: locale === 'cs' ? 'Potřebujete pomoc?' : 'Need help?',
            description: locale === 'cs'
              ? 'V případě potřeby je možné napsat tvůrci aplikace - Matějovi, přes kontaktní formulář v Nápovědě. Můžete napsat s jakýmkoliv tématem co vás zajímá nebo trápí.'
              : 'If needed, you can write to the app creator - Matěj, through the contact form in Help. You can write about any topic that interests or concerns you.',
          category: 'feature' as const,
          priority: -1
        }
      ]

      return NextResponse.json({ tips: onboardingTips, isOnboarding: true })
    }

    // Generate tips based on context and stats
    if (context.page === 'main') {
      if (stats.totalAreas === 0) {
        tips.push({
          id: 'tip-no-areas',
          title: 'Vytvořte si oblasti',
          description: 'Organizujte své cíle a kroky do oblastí pro lepší přehled.',
          category: 'organization',
          priority: 5
        })
      }

      if (stats.activeGoals === 0 && stats.totalGoals === 0) {
        tips.push({
          id: 'tip-no-goals',
          title: 'Začněte s cíli',
          description: 'Vytvořte si svůj první cíl a začněte na něm pracovat.',
          category: 'motivation',
          priority: 5
        })
      }

      if (stats.completedSteps === 0 && stats.totalSteps > 0) {
        tips.push({
          id: 'tip-no-completed-steps',
          title: 'Dokončete první krok',
          description: 'Zkuste dokončit alespoň jeden krok dnes a oslavte malý úspěch!',
          category: 'motivation',
          priority: 4
        })
      }
    } else if (context.page === 'steps') {
      if (stats.totalSteps === 0) {
        tips.push({
          id: 'tip-no-steps',
          title: 'Přidejte si kroky',
          description: 'Vytvořte si kroky pro dosažení vašich cílů. Každý cíl potřebuje konkrétní akční kroky.',
          category: 'productivity',
          priority: 5
        })
      } else if (stats.completedSteps / stats.totalSteps < 0.3) {
        tips.push({
          id: 'tip-few-completed',
          title: 'Dokončete více kroků',
          description: 'Zkuste dokončit alespoň 3 kroky dnes. Malé kroky vedou k velkým výsledkům.',
          category: 'motivation',
          priority: 4
        })
      }
    } else if (context.page === 'goals') {
      if (stats.totalGoals === 0) {
        tips.push({
          id: 'tip-no-goals-page',
          title: 'Vytvořte si cíl',
          description: 'Začněte s vytvořením svého prvního cíle. Ujistěte se, že je konkrétní a měřitelný.',
          category: 'productivity',
          priority: 5
        })
      } else if (stats.activeGoals > 5) {
        tips.push({
          id: 'tip-too-many-goals',
          title: 'Zaměřte se na důležité',
          description: 'Máte mnoho aktivních cílů. Zkuste se zaměřit na 1-3 nejdůležitější cíle najednou.',
          category: 'organization',
          priority: 4
        })
      }
    } else if (context.page === 'habits') {
      if (stats.totalHabits === 0) {
        tips.push({
          id: 'tip-no-habits',
          title: 'Vytvořte si návyk',
          description: 'Návyky jsou základem dlouhodobého úspěchu. Začněte s jedním malým návykem.',
          category: 'productivity',
          priority: 5
        })
      }
    }

    // Goal detail page tips
    if (context.section?.startsWith('goal-')) {
      tips.push({
        id: 'tip-goal-detail',
        title: 'Přidejte kroky k cíli',
        description: 'Rozdělte si cíl na menší, měřitelné kroky. To vám pomůže sledovat pokrok.',
        category: 'productivity',
        priority: 4
      })
    }

    // Area detail page tips
    if (context.section?.startsWith('area-')) {
      tips.push({
        id: 'tip-area-detail',
        title: 'Organizujte cíle v oblasti',
        description: 'Vytvářejte cíle, které se vztahují k této oblasti života.',
        category: 'organization',
        priority: 3
      })
    }

    return NextResponse.json({ tips })
  } catch (error) {
    console.error('Error generating tips:', error)
    return NextResponse.json(
      { error: 'Internal server error', tips: [] },
      { status: 500 }
    )
  }
}

