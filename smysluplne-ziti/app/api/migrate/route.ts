import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { runMigration, migrateDataFromFiles } from '@/lib/db-migrate'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

// POST - run database migration
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    // Run table creation migration
    await runMigration()
    
    // Migrate data from JSON files to database
    await migrateDataFromFiles()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully' 
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při migraci dat' },
      { status: 500 }
    )
  }
}
