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

    const tips: Tip[] = []

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

