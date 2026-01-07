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
    // Handle NULL, false, and true values - only true means completed
    const hasCompletedOnboarding = userResult[0]?.has_completed_onboarding === true

    // Get locale from query params or default to 'cs'
    const localeParam = searchParams.get('locale')
    const locale = localeParam === 'en' ? 'en' : 'cs'

    const tips: Tip[] = []

    // If user hasn't completed onboarding, show onboarding tips from database
    if (!hasCompletedOnboarding) {
      // Get onboarding tips from database
      const dbOnboardingTips = await sql`
        SELECT * FROM assistant_tips 
        WHERE category = 'onboarding' AND is_active = true
        ORDER BY priority DESC, created_at DESC
      `

      // Transform database tips to API format
      const onboardingTips = dbOnboardingTips.map((dbTip: any) => {
        // Parse JSONB fields if they come as strings
        const title = typeof dbTip.title === 'string' ? JSON.parse(dbTip.title) : dbTip.title
        const description = typeof dbTip.description === 'string' ? JSON.parse(dbTip.description) : dbTip.description
        
        return {
          id: dbTip.id,
          title: title[locale] || title.cs || title.en || '',
          description: description[locale] || description.cs || description.en || '',
          category: dbTip.category,
          priority: dbTip.priority
        }
      })

      // Return onboarding tips from database only (no fallback)
      if (onboardingTips.length > 0) {
        return NextResponse.json({ tips: onboardingTips, isOnboarding: true })
      }

      // If no onboarding tips in database, return empty array
      return NextResponse.json({ tips: [], isOnboarding: true })
    }

    // Helper function to evaluate conditions
    const evaluateConditions = (conditions: any, stats: any, context: AssistantContext, hasCompletedOnboarding: boolean): boolean => {
      if (!conditions || Object.keys(conditions).length === 0) {
        return true // No conditions means always show
      }

      // Calculate completedStepsRatio
      const completedStepsRatio = stats.totalSteps > 0 ? stats.completedSteps / stats.totalSteps : 0

      // Build evaluation context
      const evalContext: Record<string, any> = {
        totalAreas: stats.totalAreas,
        totalGoals: stats.totalGoals,
        activeGoals: stats.activeGoals,
        totalSteps: stats.totalSteps,
        completedSteps: stats.completedSteps,
        totalHabits: stats.totalHabits,
        completedStepsRatio,
        hasCompletedOnboarding,
        context_page: context.page || '',
        context_section: context.section || ''
      }

      // Evaluate all conditions (AND logic - all must be true)
      for (const [field, condition] of Object.entries(conditions)) {
        const { operator, value } = condition as { operator: string; value: any }
        const fieldValue = evalContext[field]

        if (fieldValue === undefined) {
          return false // Field doesn't exist in context
        }

        let result = false
        switch (operator) {
          case '==':
            result = fieldValue == value
            break
          case '!=':
            result = fieldValue != value
            break
          case '<':
            result = fieldValue < value
            break
          case '>':
            result = fieldValue > value
            break
          case '<=':
            result = fieldValue <= value
            break
          case '>=':
            result = fieldValue >= value
            break
          case 'startsWith':
            result = String(fieldValue).startsWith(String(value))
            break
          case 'contains':
            result = String(fieldValue).includes(String(value))
            break
          default:
            return false
        }

        if (!result) {
          return false // One condition failed
        }
      }

      return true // All conditions passed
    }

    // Get active tips from database based on context
    // Get both regular tips and inspiration tips separately
    let dbTips
    let inspirationTips
    if (context.section) {
      dbTips = await sql`
        SELECT * FROM assistant_tips 
        WHERE is_active = true 
          AND category != 'onboarding'
          AND category != 'inspiration'
          AND (context_page IS NULL OR context_page = ${context.page || ''})
          AND (context_section IS NULL OR context_section = ${context.section})
        ORDER BY priority DESC, created_at DESC
      `
      inspirationTips = await sql`
        SELECT * FROM assistant_tips 
        WHERE is_active = true 
          AND category = 'inspiration'
          AND (context_page IS NULL OR context_page = ${context.page || ''})
          AND (context_section IS NULL OR context_section = ${context.section})
        ORDER BY priority ASC, created_at DESC
      `
    } else if (context.page) {
      dbTips = await sql`
        SELECT * FROM assistant_tips 
        WHERE is_active = true 
          AND category != 'onboarding'
          AND category != 'inspiration'
          AND (context_page IS NULL OR context_page = ${context.page})
        ORDER BY priority DESC, created_at DESC
      `
      inspirationTips = await sql`
        SELECT * FROM assistant_tips 
        WHERE is_active = true 
          AND category = 'inspiration'
          AND (context_page IS NULL OR context_page = ${context.page})
        ORDER BY priority ASC, created_at DESC
      `
    } else {
      dbTips = await sql`
        SELECT * FROM assistant_tips 
        WHERE is_active = true 
          AND category != 'onboarding'
          AND category != 'inspiration'
          AND context_page IS NULL
        ORDER BY priority DESC, created_at DESC
      `
      inspirationTips = await sql`
        SELECT * FROM assistant_tips 
        WHERE is_active = true 
          AND category = 'inspiration'
          AND context_page IS NULL
        ORDER BY priority ASC, created_at DESC
      `
    }
    
    // Combine tips (inspiration will be added later if needed)
    const allDbTips = [...dbTips, ...inspirationTips]

    // Filter tips by conditions and transform to API format
    // Separate inspiration tips from other tips
    const dbTipsFormatted: Tip[] = []
    const inspirationTipsFiltered: Tip[] = []
    
    allDbTips.forEach((dbTip: any) => {
      // Parse JSONB fields
      const title = typeof dbTip.title === 'string' ? JSON.parse(dbTip.title) : dbTip.title
      const description = typeof dbTip.description === 'string' ? JSON.parse(dbTip.description) : dbTip.description
      const conditions = dbTip.conditions ? (typeof dbTip.conditions === 'string' ? JSON.parse(dbTip.conditions) : dbTip.conditions) : null

      // Evaluate conditions
      if (!evaluateConditions(conditions, stats, context, hasCompletedOnboarding)) {
        return // Tip doesn't match conditions
      }

      const tip: Tip = {
        id: dbTip.id,
        title: title[locale] || title.cs || title.en || '',
        description: description[locale] || description.cs || description.en || '',
        category: dbTip.category,
        priority: dbTip.priority
      }

      // Separate inspiration tips (they will be shown only if no other tips)
      if (dbTip.category === 'inspiration') {
        inspirationTipsFiltered.push(tip)
      } else {
        dbTipsFormatted.push(tip)
      }
    })

    // Add non-inspiration tips first
    tips.push(...dbTipsFormatted)

    // Only add inspiration tips if we have less than 3 other tips
    if (tips.length < 3 && inspirationTipsFiltered.length > 0) {
      // Inspiration tips are already sorted by priority ASC (lowest first)
      tips.push(...inspirationTipsFiltered.slice(0, 3 - tips.length))
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

