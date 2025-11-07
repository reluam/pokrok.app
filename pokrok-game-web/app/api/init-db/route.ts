import { NextRequest, NextResponse } from 'next/server'
import { initializeCestaDatabase } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    await initializeCestaDatabase()
    return NextResponse.json({ 
      success: true,
      message: 'Database initialized successfully' 
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeCestaDatabase()
    return NextResponse.json({ 
      success: true,
      message: 'Database initialized successfully' 
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

