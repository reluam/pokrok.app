import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { getUserByClerkId, getAreas } from '@/lib/cesta-db'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Support both query param and auth-based userId
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    const targetUserId = userIdParam || dbUser.id

    // Verify ownership if userId param is provided
    if (userIdParam && userIdParam !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use getAreas function which handles decryption
    const areas = await getAreas(targetUserId)
    
    return NextResponse.json({ areas })
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || 'Unknown error'
    console.error('Error fetching areas:', errorMessage)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, color, icon, order } = body
    
    console.log('Creating area with data:', { name, description, color, icon, order, dbUserId: dbUser.id })
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    
    // Get max order if not provided or invalid
    let areaOrder: number
    if (order !== undefined && order !== null && typeof order === 'number' && !isNaN(order)) {
      areaOrder = order
    } else {
      try {
        const maxOrderResult = await sql`
          SELECT COALESCE(MAX("order"), 0) as max_order 
          FROM areas 
          WHERE user_id = ${dbUser.id}
        `
        areaOrder = (maxOrderResult[0]?.max_order || 0) + 1
      } catch (orderError: any) {
        const errorMessage = orderError?.message || String(orderError) || 'Unknown error'
        console.error('Error getting max order:', errorMessage)
        areaOrder = 1 // Default to 1 if query fails
      }
    }

    // Normalize icon - allow null/undefined, use LayoutDashboard only if explicitly empty string
    const normalizedIcon = (icon && typeof icon === 'string' && icon.trim()) ? icon.trim() : (icon === null || icon === undefined ? null : 'LayoutDashboard')
    const normalizedColor = (color && typeof color === 'string' && color.trim()) ? color.trim() : '#3B82F6'
    const normalizedDescription = (description && typeof description === 'string' && description.trim()) ? description.trim() : null

    // Validate icon length (max 50 characters) if provided
    if (normalizedIcon && normalizedIcon.length > 50) {
      return NextResponse.json({ 
        error: 'Icon name is too long',
        details: `Icon name must be 50 characters or less. Current length: ${normalizedIcon.length} characters.`
      }, { status: 400 })
    }

    console.log('Normalized values:', { normalizedIcon, normalizedColor, normalizedDescription, areaOrder, id })

    try {
      const area = await sql`
        INSERT INTO areas (
          id, user_id, name, description, color, icon, "order"
        ) VALUES (
          ${id}, ${dbUser.id}, ${name.trim()}, ${normalizedDescription}, 
          ${normalizedColor}, ${normalizedIcon}, ${areaOrder}
        ) RETURNING *
      `
      
      console.log('Area created successfully:', area[0])
      return NextResponse.json({ area: area[0] })
    } catch (sqlError: any) {
      const errorMessage = sqlError?.message || String(sqlError) || 'Unknown error'
      console.error('SQL error creating area:', errorMessage)
      console.error('SQL error details:', {
        message: sqlError?.message || 'Unknown',
        code: sqlError?.code || 'Unknown',
        detail: sqlError?.detail || 'Unknown',
        hint: sqlError?.hint || 'Unknown'
      })
      
      // Check if it's a varchar length error
      if (sqlError.code === '22001' && sqlError.message?.includes('character varying')) {
        // Try to determine which field caused the error
        if (normalizedIcon && normalizedIcon.length > 50) {
          return NextResponse.json({ 
            error: 'Icon name is too long',
            details: `Icon name must be 50 characters or less. Current length: ${normalizedIcon.length} characters. Please choose a shorter icon name.`
          }, { status: 400 })
        } else if (name && name.length > 255) {
          return NextResponse.json({ 
            error: 'Area name is too long',
            details: `Area name must be 255 characters or less. Current length: ${name.length} characters.`
          }, { status: 400 })
        } else {
          return NextResponse.json({ 
            error: 'Data too long for database field',
            details: 'One of the fields exceeds the maximum allowed length. Please check the icon name (max 50 characters) and area name (max 255 characters).'
          }, { status: 400 })
        }
      }
      
      throw sqlError // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || 'Unknown error'
    console.error('Error creating area:', errorMessage)
    console.error('Error stack:', error?.stack || 'No stack trace')
    
    // Check if it's a varchar length error in the outer catch too
    if (error.code === '22001' && error.message?.includes('character varying')) {
      return NextResponse.json({ 
        error: 'Data too long for database field',
        details: 'One of the fields exceeds the maximum allowed length. Please check the icon name (max 50 characters) and area name (max 255 characters).'
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error.message || String(error)) : undefined
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, name, description, color, icon, order } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 })
    }

    // Validate name length
    if (name && name.trim().length > 255) {
      return NextResponse.json({ 
        error: 'Area name is too long',
        details: `Area name must be 255 characters or less. Current length: ${name.trim().length} characters.`
      }, { status: 400 })
    }

    // Verify ownership and get existing area data to preserve fields that aren't being updated
    const existingArea = await sql`
      SELECT user_id, name, description, color, icon, "order" FROM areas WHERE id = ${id}
    `
    
    if (existingArea.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    if (existingArea[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const existing = existingArea[0]
    
    // Normalize icon only if it's being updated (icon is in body)
    // If icon is not provided, keep existing value
    let normalizedIcon: string | null = undefined as any
    if (icon !== undefined) {
      // Icon is being updated - normalize it
      normalizedIcon = (icon && typeof icon === 'string' && icon.trim()) ? icon.trim() : (icon === null ? null : 'LayoutDashboard')
      
      // Validate icon length if provided
      if (normalizedIcon && normalizedIcon.length > 50) {
        return NextResponse.json({ 
          error: 'Icon name is too long',
          details: `Icon name must be 50 characters or less. Current length: ${normalizedIcon.length} characters. Please choose a shorter icon name.`
        }, { status: 400 })
      }
    }
    
    try {
      const area = await sql`
        UPDATE areas 
        SET 
          name = ${name !== undefined ? (name || '') : existing.name},
          description = ${description !== undefined ? (description || null) : existing.description},
          color = ${color !== undefined ? (color || '#3B82F6') : existing.color},
          icon = ${icon !== undefined ? normalizedIcon : existing.icon},
          "order" = ${order !== undefined ? order : existing.order},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (area.length === 0) {
        return NextResponse.json({ error: 'Area not found' }, { status: 404 })
      }
      
      return NextResponse.json({ area: area[0] })
    } catch (sqlError: any) {
      const errorMessage = sqlError?.message || String(sqlError) || 'Unknown error'
      console.error('SQL error updating area:', errorMessage)
      
      // Check if it's a varchar length error
      if (sqlError.code === '22001' && sqlError.message?.includes('character varying')) {
        if (icon !== undefined && normalizedIcon && normalizedIcon.length > 50) {
          return NextResponse.json({ 
            error: 'Icon name is too long',
            details: `Icon name must be 50 characters or less. Current length: ${normalizedIcon.length} characters. Please choose a shorter icon name.`
          }, { status: 400 })
        } else if (name && name.length > 255) {
          return NextResponse.json({ 
            error: 'Area name is too long',
            details: `Area name must be 255 characters or less. Current length: ${name.length} characters.`
          }, { status: 400 })
        } else {
          return NextResponse.json({ 
            error: 'Data too long for database field',
            details: 'One of the fields exceeds the maximum allowed length. Please check the icon name (max 50 characters) and area name (max 255 characters).'
          }, { status: 400 })
        }
      }
      
      throw sqlError
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || 'Unknown error'
    console.error('Error updating area:', errorMessage)
    
    // Check if it's a varchar length error in the outer catch too
    if (error.code === '22001' && error.message?.includes('character varying')) {
      return NextResponse.json({ 
        error: 'Data too long for database field',
        details: 'One of the fields exceeds the maximum allowed length. Please check the icon name (max 50 characters) and area name (max 255 characters).'
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      console.log('DELETE area: Unauthorized - no clerkUserId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      console.log('DELETE area: User not found for clerkUserId:', clerkUserId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let body: any = {}
    try {
      const bodyText = await request.text()
      if (bodyText) {
        body = JSON.parse(bodyText)
      }
    } catch (parseError: any) {
      console.log('DELETE area: Failed to parse request body:', parseError?.message || String(parseError))
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const { id, deleteRelated } = body
    
    console.log('DELETE area request:', { id, deleteRelated, dbUserId: dbUser.id })
    
    if (!id) {
      console.log('DELETE area: Area ID is required')
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingArea = await sql`
      SELECT user_id FROM areas WHERE id = ${id}
    `
    
    console.log('DELETE area: Existing area check:', { found: existingArea.length > 0, userId: existingArea[0]?.user_id, dbUserId: dbUser.id })
    
    if (existingArea.length === 0) {
      console.log('DELETE area: Area not found:', id)
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    if (existingArea[0].user_id !== dbUser.id) {
      console.log('DELETE area: Unauthorized - user mismatch')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (deleteRelated) {
      // Delete all related goals, steps, and habits
      // Delete steps associated with goals in this area
      await sql`
        DELETE FROM daily_steps 
        WHERE goal_id IN (
          SELECT id FROM goals WHERE area_id = ${id} AND user_id = ${dbUser.id}
        )
      `
      
      // Delete goals in this area
      await sql`
        DELETE FROM goals 
        WHERE area_id = ${id} AND user_id = ${dbUser.id}
      `
      
      // Delete habits in this area
      await sql`
        DELETE FROM habits 
        WHERE area_id = ${id} AND user_id = ${dbUser.id}
      `
    } else {
      // If deleteRelated is false, remove the area_id reference (set to NULL) for all related items
      // Unlink goals from this area
      await sql`
        UPDATE goals 
        SET area_id = NULL 
        WHERE area_id = ${id} AND user_id = ${dbUser.id}
      `
      
      // Unlink habits from this area
      await sql`
        UPDATE habits 
        SET area_id = NULL 
        WHERE area_id = ${id} AND user_id = ${dbUser.id}
      `
      
      // For steps: only unlink if they have area_id directly set (not through goals)
      // Steps can have either area_id OR goal_id, not both
      // We only unlink steps that have area_id set directly (not through a goal)
      await sql`
        UPDATE daily_steps 
        SET area_id = NULL 
        WHERE area_id = ${id} AND user_id = ${dbUser.id}
      `
    }

    const result = await sql`
      DELETE FROM areas 
      WHERE id = ${id}
      RETURNING id
    `
    
    console.log('DELETE area: Delete result:', { deleted: result.length > 0, id: result[0]?.id })
    
    if (result.length === 0) {
      console.log('DELETE area: Area not found after delete attempt:', id)
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    console.log('DELETE area: Success')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    // Safely log error without circular references
    const errorMessage = error?.message || String(error) || 'Unknown error'
    console.error('Error deleting area:', errorMessage)
    console.error('Error stack:', error?.stack)
    console.error('Error code:', error?.code)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { areaIds } = body
    
    if (!Array.isArray(areaIds)) {
      return NextResponse.json({ error: 'areaIds must be an array' }, { status: 400 })
    }

    // Update order for each area
    for (let i = 0; i < areaIds.length; i++) {
      const areaId = areaIds[i]
      await sql`
        UPDATE areas 
        SET "order" = ${i + 1}, updated_at = NOW()
        WHERE id = ${areaId} AND user_id = ${dbUser.id}
      `
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || 'Unknown error'
    console.error('Error updating area order:', errorMessage)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}
