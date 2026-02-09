import { NextRequest, NextResponse } from 'next/server'
import { getNewslettersForBlog } from '@/lib/newsletter-campaigns-db'

// GET - Get newsletters for blog (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const newsletters = await getNewslettersForBlog()
    return NextResponse.json(newsletters)
  } catch (error: any) {
    console.error('Error fetching newsletters for blog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    )
  }
}
