import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { runMigration, migrateDataFromFiles } from '@/lib/db-migrate'
import { getPool } from '@/lib/db'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

// GET - check migration status
export async function GET(request: NextRequest) {
  try {
    const pool = getPool()
    const client = await pool.connect()
    try {
      // Check if tables exist
      const articlesCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'articles')"
      )
      const inspirationCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inspiration')"
      )
      const smallThingsCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'small_things')"
      )
      const migrationsCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migrations')"
      )
      
      // Check if featured column exists
      let featuredColumnExists = false
      if (articlesCheck.rows[0].exists) {
        const columnCheck = await client.query(
          "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'featured')"
        )
        featuredColumnExists = columnCheck.rows[0].exists
      }
      
      // Get migration history
      let migrationsRun: string[] = []
      if (migrationsCheck.rows[0].exists) {
        const migrationsResult = await client.query('SELECT id FROM migrations ORDER BY id')
        migrationsRun = migrationsResult.rows.map((row: any) => row.id)
      }
      
      const articlesCount = articlesCheck.rows[0].exists 
        ? (await client.query('SELECT COUNT(*) as count FROM articles')).rows[0].count
        : 0
      const inspirationCount = inspirationCheck.rows[0].exists
        ? (await client.query('SELECT COUNT(*) as count FROM inspiration')).rows[0].count
        : 0
      const smallThingsCount = smallThingsCheck.rows[0].exists
        ? (await client.query('SELECT COUNT(*) as count FROM small_things')).rows[0].count
        : 0

      return NextResponse.json({
        tablesExist: {
          articles: articlesCheck.rows[0].exists,
          inspiration: inspirationCheck.rows[0].exists,
          small_things: smallThingsCheck.rows[0].exists,
          migrations: migrationsCheck.rows[0].exists,
        },
        columnsExist: {
          featured: featuredColumnExists,
        },
        dataCount: {
          articles: parseInt(articlesCount),
          inspiration: parseInt(inspirationCount),
          small_things: parseInt(smallThingsCount),
        },
        migrationsRun,
      })
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Migration status check error:', error)
    const errorMessage = error.message || 'Chyba při kontrole migrace'
    const errorDetails = {
      message: errorMessage,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      // Check if DATABASE_URL is set
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    }
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    )
  }
}

// POST - run database migration
export async function POST(request: NextRequest) {
  try {
    // Run all migrations
    await runMigration()
    
    // Migrate data from JSON files to database (only if tables are empty)
    await migrateDataFromFiles()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully' 
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    const errorMessage = error.message || 'Chyba při migraci dat'
    const errorDetails = {
      message: errorMessage,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      // Check if DATABASE_URL is set
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    }
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    )
  }
}
