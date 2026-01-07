import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * Endpoint to seed help categories into the database
 * Admin only - can be called to populate initial help categories
 * 
 * POST /api/setup/seed-help-categories
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

    // Ensure help_categories table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS help_categories (
          id VARCHAR(255) PRIMARY KEY,
          title JSONB NOT NULL,
          description JSONB,
          slug VARCHAR(100) UNIQUE,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating help_categories table:', tableError)
      }
    }

    // Check if help categories already exist
    const existingCategories = await sql`
      SELECT COUNT(*) as count FROM help_categories
    `
    
    if (parseInt(existingCategories[0]?.count || '0') > 0) {
      return NextResponse.json({
        success: true,
        message: 'Help categories already exist in database',
        alreadyExists: true,
        count: parseInt(existingCategories[0]?.count || '0')
      })
    }

    // Existing help categories from HelpView
    const helpCategories = [
      {
        id: randomUUID(),
        slug: 'getting-started',
        title: { cs: 'První kroky', en: 'Getting Started' },
        description: null,
        sort_order: 0,
        is_active: true
      },
      {
        id: randomUUID(),
        slug: 'overview',
        title: { cs: 'Zobrazení', en: 'Views' },
        description: null,
        sort_order: 1,
        is_active: true
      },
      {
        id: randomUUID(),
        slug: 'navigation',
        title: { cs: 'Navigace', en: 'Navigation' },
        description: null,
        sort_order: 2,
        is_active: true
      },
      {
        id: randomUUID(),
        slug: 'areas',
        title: { cs: 'Oblasti', en: 'Areas' },
        description: null,
        sort_order: 3,
        is_active: true
      },
      {
        id: randomUUID(),
        slug: 'goals',
        title: { cs: 'Cíle', en: 'Goals' },
        description: null,
        sort_order: 4,
        is_active: true
      },
      {
        id: randomUUID(),
        slug: 'steps',
        title: { cs: 'Kroky', en: 'Steps' },
        description: null,
        sort_order: 5,
        is_active: true
      },
      {
        id: randomUUID(),
        slug: 'habits',
        title: { cs: 'Návyky', en: 'Habits' },
        description: null,
        sort_order: 6,
        is_active: true
      }
    ]

    // Insert all help categories
    const insertedCategories = []
    for (const category of helpCategories) {
      try {
        const result = await sql`
          INSERT INTO help_categories (id, title, description, slug, sort_order, is_active, created_by, created_at, updated_at)
          VALUES (
            ${category.id},
            ${JSON.stringify(category.title)}::jsonb,
            NULL,
            ${category.slug},
            ${category.sort_order},
            ${category.is_active},
            ${dbUser.id},
            NOW(),
            NOW()
          )
          RETURNING id
        `
        insertedCategories.push(result[0]?.id)
      } catch (insertError: any) {
        // If category already exists, skip it
        if (insertError?.message?.includes('duplicate key') || insertError?.message?.includes('already exists')) {
          console.log(`Category ${category.slug} already exists, skipping...`)
          continue
        }
        console.error(`Error inserting category ${category.slug}:`, insertError)
      }
    }

    console.log(`✓ Seeded ${insertedCategories.length} help categories`)

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedCategories.length} help categories`,
      insertedCount: insertedCategories.length,
      totalCategories: helpCategories.length
    })
  } catch (error: any) {
    console.error('Error seeding help categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed help categories',
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


