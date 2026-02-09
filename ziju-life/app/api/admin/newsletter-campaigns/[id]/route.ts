import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import {
  getNewsletterCampaign,
  updateNewsletterCampaign,
  deleteNewsletterCampaign,
} from '@/lib/newsletter-campaigns-db'

// GET - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const campaign = await getNewsletterCampaign(id)
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PUT - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { subject, sender, body: bodyContent, scheduledAt, showOnBlog } = body

    // For sent campaigns, allow updating only showOnBlog
    const existingCampaign = await getNewsletterCampaign(id)
    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (existingCampaign.status === 'sent' && showOnBlog !== undefined && subject === undefined) {
      // Only updating showOnBlog for sent campaign
      const campaign = await updateNewsletterCampaign(
        id,
        existingCampaign.subject,
        existingCampaign.sender,
        existingCampaign.body,
        existingCampaign.scheduledAt || undefined,
        showOnBlog
      )
      return NextResponse.json(campaign)
    }

    if (!subject || !sender || !bodyContent) {
      return NextResponse.json(
        { error: 'Subject, sender, and body are required' },
        { status: 400 }
      )
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : undefined
    const campaign = await updateNewsletterCampaign(
      id,
      subject,
      sender,
      bodyContent,
      scheduledDate,
      showOnBlog
    )

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    
    if (error.message === 'Campaign not found') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Cannot edit sent campaign') {
      return NextResponse.json(
        { error: 'Cannot edit sent campaign' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await verifySession()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const deleted = await deleteNewsletterCampaign(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Campaign not found or cannot be deleted' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
