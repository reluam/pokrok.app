import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { getUserByClerkId } from '@/lib/cesta-db'

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

    const areas = await sql`
      SELECT * FROM areas 
      WHERE user_id = ${targetUserId}
      ORDER BY "order" ASC, created_at ASC
    `
    
    return NextResponse.json({ areas })
  } catch (error: any) {
    console.error('Error fetching areas:', error)
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
      } catch (orderError) {
        console.error('Error getting max order:', orderError)
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
      console.error('SQL error creating area:', sqlError)
      console.error('SQL error details:', {
        message: sqlError.message,
        code: sqlError.code,
        detail: sqlError.detail,
        hint: sqlError.hint
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
    console.error('Error creating area:', error)
    console.error('Error stack:', error.stack)
    
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

    // Normalize icon - allow null/undefined, use LayoutDashboard only if explicitly empty string
    const normalizedIcon = (icon && typeof icon === 'string' && icon.trim()) ? icon.trim() : (icon === null || icon === undefined ? null : 'LayoutDashboard')
    
    // Validate icon length if provided
    if (normalizedIcon && normalizedIcon.length > 50) {
      return NextResponse.json({ 
        error: 'Icon name is too long',
        details: `Icon name must be 50 characters or less. Current length: ${normalizedIcon.length} characters. Please choose a shorter icon name.`
      }, { status: 400 })
    }

    // Verify ownership and get current area
    const existingArea = await sql`
      SELECT * FROM areas WHERE id = ${id}
    `
    
    if (existingArea.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    if (existingArea[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const currentArea = existingArea[0]

    try {
      // Only update fields that are actually provided
      // Use current values if field is not provided
      const finalName = name !== undefined ? name : currentArea.name
      const finalDescription = description !== undefined ? description : currentArea.description
      const finalColor = color !== undefined ? color : currentArea.color
      const finalIcon = icon !== undefined ? normalizedIcon : currentArea.icon
      const finalOrder = order !== undefined ? order : currentArea.order

      const area = await sql`
        UPDATE areas 
        SET 
          name = ${finalName},
          description = ${finalDescription},
          color = ${finalColor},
          icon = ${finalIcon},
          "order" = ${finalOrder},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (area.length === 0) {
        return NextResponse.json({ error: 'Area not found' }, { status: 404 })
      }
      
      return NextResponse.json({ area: area[0] })
    } catch (sqlError: any) {
      console.error('SQL error updating area:', sqlError)
      
      // Check if it's a varchar length error
      if (sqlError.code === '22001' && sqlError.message?.includes('character varying')) {
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
      
      throw sqlError
    }
  } catch (error: any) {
    console.error('Error updating area:', error)
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, deleteRelated } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingArea = await sql`
      SELECT user_id FROM areas WHERE id = ${id}
    `
    
    if (existingArea.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    if (existingArea[0].user_id !== dbUser.id) {
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
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting area:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

