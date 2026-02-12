import { NextRequest, NextResponse } from 'next/server'
import {
  getInspirationData,
  addInspirationItem,
  updateInspirationItem,
  deleteInspirationItem,
  type InspirationType,
} from '@/lib/inspiration-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    // Only include inactive items if explicitly requested (for admin)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const data = await getInspirationData(includeInactive)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching inspiration data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspiration data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...item } = body

    if (!type || !['blog', 'video', 'book', 'article', 'other', 'music'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }

    // For blog type, url is optional (can use content instead)
    // For other types, url is required
    if (type !== 'blog' && !item.url) {
      return NextResponse.json(
        { error: 'URL is required for this type' },
        { status: 400 }
      )
    }

    const newItem = await addInspirationItem(type as InspirationType, item)
    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('Error creating inspiration item:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inspiration item' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, ...updates } = body

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and id are required' },
        { status: 400 }
      )
    }

    const updatedItem = await updateInspirationItem(type as InspirationType, id, updates)
    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating inspiration item:', error)
    return NextResponse.json(
      { error: 'Failed to update inspiration item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and id are required' },
        { status: 400 }
      )
    }

    const deleted = await deleteInspirationItem(type as InspirationType, id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inspiration item:', error)
    return NextResponse.json(
      { error: 'Failed to delete inspiration item' },
      { status: 500 }
    )
  }
}
