import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initializeDatabase()
    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
