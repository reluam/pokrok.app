import { NextRequest, NextResponse } from 'next/server'
import { getNewsletterCampaign } from '@/lib/newsletter-campaigns-db'

// GET - Get single newsletter for blog (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = await getNewsletterCampaign(id)
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      )
    }

    // Only return if sent and showOnBlog is true
    if (campaign.status !== 'sent' || !campaign.showOnBlog) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('Error fetching newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter' },
      { status: 500 }
    )
  }
}
