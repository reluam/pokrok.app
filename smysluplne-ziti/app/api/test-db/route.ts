import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET - test database connection
export async function GET(request: NextRequest) {
  try {
    const pool = getPool()
    const client = await pool.connect()
    
    try {
      // Test query
      const result = await client.query('SELECT NOW() as current_time, version() as version')
      
      return NextResponse.json({ 
        success: true,
        message: 'Database connection successful',
        data: {
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
        }
      })
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Chyba při připojení k databázi',
        details: error.code || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
