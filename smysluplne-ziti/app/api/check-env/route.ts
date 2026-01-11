import { NextRequest, NextResponse } from 'next/server'

// GET - check environment variables (for debugging)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'not set',
    nodeEnv: process.env.NODE_ENV,
    // Don't expose full connection string for security
  })
}
