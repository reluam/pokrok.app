import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import {
  createNewsletterCampaign,
  getNewsletterCampaigns,
  updateNewsletterCampaign,
  deleteNewsletterCampaign,
  getNewsletterCampaign,
} from '@/lib/newsletter-campaigns-db'

// GET - List all campaigns
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaigns = await getNewsletterCampaigns()
    return NextResponse.json(campaigns)
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, description, sections, scheduledAt } = body

    if (!subject || !sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: 'Subject and at least one section are required' },
        { status: 400 }
      )
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : undefined
    const campaign = await createNewsletterCampaign(subject, description || '', sections, scheduledDate)

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
