import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Ensure view_settings table exists
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS view_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        view_type TEXT NOT NULL,
        visible_sections JSONB DEFAULT '{}'::jsonb,
        order_index INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, view_type)
      )
    `
    
    // Add order_index column if it doesn't exist (for existing tables)
    try {
      await sql`
        ALTER TABLE view_settings 
        ADD COLUMN IF NOT EXISTS order_index INTEGER
      `
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate column')) {
        console.error('Error adding order_index column:', error)
      }
    }
  } catch (error: any) {
    if (!error.message?.includes('already exists')) {
      console.error('Error creating view_settings table:', error)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTableExists()
    
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const viewType = request.nextUrl.searchParams.get('view_type')
    
    if (viewType) {
      // Get settings for specific view type
      const settings = await sql`
        SELECT * FROM view_settings 
        WHERE user_id = ${dbUser.id} AND view_type = ${viewType}
        LIMIT 1
      `
      
      if (settings.length > 0) {
        const result = settings[0]
        // Ensure _visible_in_navigation is set (default to true if not present)
        if (result.visible_sections && typeof result.visible_sections === 'object') {
          if (!('_visible_in_navigation' in result.visible_sections)) {
            result.visible_sections._visible_in_navigation = true
          }
        }
        // Include order_index in response - explicitly return the value from database
        const orderIndex = result.order_index !== null && result.order_index !== undefined 
          ? Number(result.order_index) 
          : null
        return NextResponse.json({
          ...result,
          order_index: orderIndex
        })
      } else {
        // Return default settings with _visible_in_navigation = true
        const defaultSections = getDefaultVisibleSections(viewType)
        defaultSections._visible_in_navigation = true
        return NextResponse.json({
          user_id: dbUser.id,
          view_type: viewType,
          visible_sections: defaultSections
        })
      }
    } else {
      // Get all settings, ordered by order_index
      const settings = await sql`
        SELECT * FROM view_settings 
        WHERE user_id = ${dbUser.id}
        ORDER BY order_index ASC NULLS LAST
      `
      return NextResponse.json(settings)
    }
  } catch (error: any) {
    console.error('Error fetching view settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTableExists()
    
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { view_type, visible_sections, visible_in_navigation, order_index } = body

    console.log('Saving view settings:', { view_type, order_index, hasOrderIndex: order_index !== undefined })

    if (!view_type) {
      return NextResponse.json({ error: 'view_type is required' }, { status: 400 })
    }

    // Check if settings already exist
    const existing = await sql`
      SELECT id FROM view_settings 
      WHERE user_id = ${dbUser.id} AND view_type = ${view_type}
      LIMIT 1
    `

    const sectionsJson = JSON.stringify(visible_sections || getDefaultVisibleSections(view_type))
    
    // Handle visible_in_navigation - store in visible_sections JSONB as a special key
    let finalSections = visible_sections || getDefaultVisibleSections(view_type)
    if (visible_in_navigation !== undefined) {
      finalSections = { ...finalSections, _visible_in_navigation: visible_in_navigation }
    }
    const finalSectionsJson = JSON.stringify(finalSections)
    
    let settings
    if (existing.length > 0) {
      // Update existing
      if (order_index !== undefined) {
        settings = await sql`
          UPDATE view_settings 
          SET visible_sections = ${finalSectionsJson}::jsonb,
              order_index = ${order_index},
              updated_at = NOW()
          WHERE user_id = ${dbUser.id} AND view_type = ${view_type}
          RETURNING *
        `
        console.log(`Updated existing settings for ${view_type} with order_index ${order_index}:`, settings[0]?.order_index)
      } else {
        settings = await sql`
          UPDATE view_settings 
          SET visible_sections = ${finalSectionsJson}::jsonb,
              updated_at = NOW()
          WHERE user_id = ${dbUser.id} AND view_type = ${view_type}
          RETURNING *
        `
      }
    } else {
      // Create new - default visible_in_navigation to true if not specified
      const defaultVisibleInNav = visible_in_navigation !== undefined ? visible_in_navigation : true
      const defaultSections = { ...finalSections, _visible_in_navigation: defaultVisibleInNav }
      if (order_index !== undefined) {
        settings = await sql`
          INSERT INTO view_settings (user_id, view_type, visible_sections, order_index)
          VALUES (${dbUser.id}, ${view_type}, ${JSON.stringify(defaultSections)}::jsonb, ${order_index})
          RETURNING *
        `
        console.log(`Created new settings for ${view_type} with order_index ${order_index}:`, settings[0]?.order_index)
      } else {
        settings = await sql`
          INSERT INTO view_settings (user_id, view_type, visible_sections)
          VALUES (${dbUser.id}, ${view_type}, ${JSON.stringify(defaultSections)}::jsonb)
          RETURNING *
        `
      }
    }

    const result = settings[0]
    console.log(`Returning settings for ${view_type}:`, { order_index: result?.order_index, type: typeof result?.order_index })
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error saving view settings:', error)
    console.error('Error details:', {
      view_type,
      order_index,
      hasOrderIndex: order_index !== undefined,
      errorMessage: error.message,
      errorStack: error.stack
    })
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

function getDefaultVisibleSections(viewType: string): Record<string, boolean> {
  const defaults: Record<string, Record<string, boolean>> = {
    day: {
      quickOverview: true,
      todayFocus: true,
      habits: true,
      futureSteps: true,
      overdueSteps: true
    },
    week: {
      quickOverview: true,
      weeklyFocus: true,
      habits: true,
      futureSteps: true,
      overdueSteps: true
    },
    month: {
      calendar: true,
      statistics: true,
      habits: true,
      futureSteps: true,
      overdueSteps: true
    },
    year: {
      calendar: true,
      goals: true,
      insights: true
    },
    areas: {
      statistics: true,
      goals: true,
      steps: true,
      habits: true,
      todayFocus: true,
      futureSteps: true,
      overdueSteps: true
    },
    only_the_important: {
      // No specific sections for now - this is a special view
    },
    daily_review: {
      // No specific sections for now - this is a special view
    }
  }
  
  return defaults[viewType] || {}
}

