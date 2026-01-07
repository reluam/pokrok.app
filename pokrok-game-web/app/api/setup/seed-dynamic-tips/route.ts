import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * Endpoint to seed dynamic tips into the database
 * Admin only - can be called to populate initial dynamic tips with conditions
 * 
 * POST /api/setup/seed-dynamic-tips
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Ensure conditions column exists
    try {
      await sql`
        ALTER TABLE assistant_tips 
        ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT NULL
      `
    } catch (columnError: any) {
      // Column might already exist, ignore
    }

    // Check if dynamic tips already exist
    const existingTips = await sql`
      SELECT COUNT(*) as count FROM assistant_tips 
      WHERE category != 'onboarding' AND id LIKE 'tip-%'
    `
    
    if (parseInt(existingTips[0]?.count || '0') > 0) {
      return NextResponse.json({
        success: true,
        message: 'Dynamic tips already exist in database',
        alreadyExists: true,
        count: parseInt(existingTips[0]?.count || '0')
      })
    }

    // Dynamic tips with conditions (matching the hardcoded tips in /api/assistant/tips/route.ts)
    const dynamicTips = [
      {
        id: 'tip-no-areas',
        title: { cs: 'Vytvořte si oblasti', en: 'Create areas' },
        description: {
          cs: 'Organizujte své cíle a kroky do oblastí pro lepší přehled.',
          en: 'Organize your goals and steps into areas for better overview.'
        },
        category: 'organization',
        priority: 5,
        context_page: 'main',
        conditions: {
          totalAreas: { operator: '==', value: 0 }
        }
      },
      {
        id: 'tip-no-goals',
        title: { cs: 'Začněte s cíli', en: 'Start with goals' },
        description: {
          cs: 'Vytvořte si svůj první cíl a začněte na něm pracovat.',
          en: 'Create your first goal and start working on it.'
        },
        category: 'motivation',
        priority: 5,
        context_page: 'main',
        conditions: {
          activeGoals: { operator: '==', value: 0 },
          totalGoals: { operator: '==', value: 0 }
        }
      },
      {
        id: 'tip-no-completed-steps',
        title: { cs: 'Dokončete první krok', en: 'Complete your first step' },
        description: {
          cs: 'Zkuste dokončit alespoň jeden krok dnes a oslavte malý úspěch!',
          en: 'Try to complete at least one step today and celebrate a small success!'
        },
        category: 'motivation',
        priority: 4,
        context_page: 'main',
        conditions: {
          completedSteps: { operator: '==', value: 0 },
          totalSteps: { operator: '>', value: 0 }
        }
      },
      {
        id: 'tip-no-steps',
        title: { cs: 'Přidejte si kroky', en: 'Add steps' },
        description: {
          cs: 'Vytvořte si kroky pro dosažení vašich cílů. Každý cíl potřebuje konkrétní akční kroky.',
          en: 'Create steps to achieve your goals. Every goal needs specific action steps.'
        },
        category: 'productivity',
        priority: 5,
        context_page: 'steps',
        conditions: {
          totalSteps: { operator: '==', value: 0 }
        }
      },
      {
        id: 'tip-few-completed',
        title: { cs: 'Dokončete více kroků', en: 'Complete more steps' },
        description: {
          cs: 'Zkuste dokončit alespoň 3 kroky dnes. Malé kroky vedou k velkým výsledkům.',
          en: 'Try to complete at least 3 steps today. Small steps lead to big results.'
        },
        category: 'motivation',
        priority: 4,
        context_page: 'steps',
        conditions: {
          completedStepsRatio: { operator: '<', value: 0.3 }
        }
      },
      {
        id: 'tip-no-goals-page',
        title: { cs: 'Vytvořte si cíl', en: 'Create a goal' },
        description: {
          cs: 'Začněte s vytvořením svého prvního cíle. Ujistěte se, že je konkrétní a měřitelný.',
          en: 'Start by creating your first goal. Make sure it is specific and measurable.'
        },
        category: 'productivity',
        priority: 5,
        context_page: 'goals',
        conditions: {
          totalGoals: { operator: '==', value: 0 }
        }
      },
      {
        id: 'tip-too-many-goals',
        title: { cs: 'Zaměřte se na důležité', en: 'Focus on what matters' },
        description: {
          cs: 'Máte mnoho aktivních cílů. Zkuste se zaměřit na 1-3 nejdůležitější cíle najednou.',
          en: 'You have many active goals. Try to focus on 1-3 most important goals at once.'
        },
        category: 'organization',
        priority: 4,
        context_page: 'goals',
        conditions: {
          activeGoals: { operator: '>', value: 5 }
        }
      },
      {
        id: 'tip-no-habits',
        title: { cs: 'Vytvořte si návyk', en: 'Create a habit' },
        description: {
          cs: 'Návyky jsou základem dlouhodobého úspěchu. Začněte s jedním malým návykem.',
          en: 'Habits are the foundation of long-term success. Start with one small habit.'
        },
        category: 'productivity',
        priority: 5,
        context_page: 'habits',
        conditions: {
          totalHabits: { operator: '==', value: 0 }
        }
      },
      {
        id: 'tip-goal-detail',
        title: { cs: 'Přidejte kroky k cíli', en: 'Add steps to goal' },
        description: {
          cs: 'Rozdělte si cíl na menší, měřitelné kroky. To vám pomůže sledovat pokrok.',
          en: 'Break down your goal into smaller, measurable steps. This will help you track progress.'
        },
        category: 'productivity',
        priority: 4,
        context_section: 'goal-',
        conditions: {
          context_section: { operator: 'startsWith', value: 'goal-' }
        }
      },
      {
        id: 'tip-area-detail',
        title: { cs: 'Organizujte cíle v oblasti', en: 'Organize goals in area' },
        description: {
          cs: 'Vytvářejte cíle, které se vztahují k této oblasti života.',
          en: 'Create goals that relate to this area of life.'
        },
        category: 'organization',
        priority: 3,
        context_section: 'area-',
        conditions: {
          context_section: { operator: 'startsWith', value: 'area-' }
        }
      }
    ]

    // Insert all dynamic tips
    const insertedTips = []
    for (const tip of dynamicTips) {
      try {
        const result = await sql`
          INSERT INTO assistant_tips (id, title, description, category, priority, context_page, context_section, is_active, conditions, created_by, created_at, updated_at)
          VALUES (
            ${tip.id},
            ${JSON.stringify(tip.title)}::jsonb,
            ${JSON.stringify(tip.description)}::jsonb,
            ${tip.category},
            ${tip.priority},
            ${tip.context_page || null},
            ${tip.context_section || null},
            true,
            ${JSON.stringify(tip.conditions)}::jsonb,
            ${dbUser.id},
            NOW(),
            NOW()
          )
          RETURNING id
        `
        insertedTips.push(result[0]?.id)
      } catch (insertError: any) {
        // If tip already exists, skip it
        if (insertError?.message?.includes('duplicate key') || insertError?.message?.includes('already exists')) {
          console.log(`Tip ${tip.id} already exists, skipping...`)
          continue
        }
        console.error(`Error inserting tip ${tip.id}:`, insertError)
      }
    }

    console.log(`✓ Seeded ${insertedTips.length} dynamic tips`)

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedTips.length} dynamic tips`,
      insertedCount: insertedTips.length,
      totalTips: dynamicTips.length
    })
  } catch (error: any) {
    console.error('Error seeding dynamic tips:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed dynamic tips',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy browser access
export async function GET(request: NextRequest) {
  return POST(request)
}

