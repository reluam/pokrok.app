import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { getUserByClerkId, createArea } from '@/lib/cesta-db'
import { decryptFields } from '@/lib/encryption'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser || !dbUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('🚀 Starting migration: Goals → Milestones')

    // Step 1: Ensure milestones table exists
    console.log('📋 Step 1: Ensuring milestones table exists...')
    await sql`
      CREATE TABLE IF NOT EXISTS milestones (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area_id VARCHAR(255) NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_milestones_area_id ON milestones(area_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id)
    `
    console.log('✅ Milestones table ready')

    // Step 2: Get all goals (grouped by user for decryption)
    console.log('📋 Step 2: Fetching all goals...')
    const allGoalsRaw = await sql`
      SELECT * FROM goals ORDER BY created_at ASC
    `
    
    // Decrypt goals by user
    const allGoals: any[] = []
    const goalsByUser = new Map<string, any[]>()
    
    for (const goal of allGoalsRaw) {
      if (!goalsByUser.has(goal.user_id)) {
        goalsByUser.set(goal.user_id, [])
      }
      goalsByUser.get(goal.user_id)!.push(goal)
    }
    
    for (const [userId, userGoals] of Array.from(goalsByUser.entries())) {
      const decryptedGoals = userGoals.map(goal => 
        decryptFields(goal, userId, ['title', 'description'])
      )
      allGoals.push(...decryptedGoals)
    }
    
    console.log(`✅ Found ${allGoals.length} goals (decrypted)`)

    // Step 3: Create areas from goals without area_id
    console.log('📋 Step 3: Creating areas from goals without area_id...')
    const goalsWithoutArea = allGoals.filter((g: any) => !g.area_id)
    console.log(`Found ${goalsWithoutArea.length} goals without area_id`)

    const areaIdMap = new Map<string, string>() // Maps old goal_id to new area_id

    for (const goal of goalsWithoutArea) {
      // Get max order for this user
      const maxOrderResult = await sql`
        SELECT COALESCE(MAX("order"), 0) as max_order 
        FROM areas 
        WHERE user_id = ${goal.user_id}
      `
      const nextOrder = (maxOrderResult[0]?.max_order || 0) + 1

      // Create area from goal using createArea function (handles encryption)
      try {
        const newArea = await createArea(
          goal.user_id,
          goal.title,
          goal.description || undefined,
          '#3B82F6',
          goal.icon || undefined,
          nextOrder
        )
        areaIdMap.set(goal.id, newArea.id)
        console.log(`✅ Created area "${goal.title}" (${newArea.id}) from goal ${goal.id}`)
      } catch (error) {
        console.error(`❌ Error creating area from goal ${goal.id}:`, error)
        // Continue with other goals
      }
    }

    // Step 4: Create milestones from all goals
    console.log('📋 Step 4: Creating milestones from all goals...')
    let milestonesCreated = 0

    for (const goal of allGoals) {
      let targetAreaId = goal.area_id

      // If goal doesn't have area_id, use the newly created area
      if (!targetAreaId && areaIdMap.has(goal.id)) {
        targetAreaId = areaIdMap.get(goal.id)!
      }

      // Skip if still no area_id (shouldn't happen, but safety check)
      if (!targetAreaId) {
        console.warn(`⚠️ Skipping goal ${goal.id} - no area_id available`)
        continue
      }

      // Use target_date as completed_date for milestones
      const milestoneId = randomUUID()
      await sql`
        INSERT INTO milestones (
          id, user_id, area_id, title, description, completed_date, created_at, updated_at
        ) VALUES (
          ${milestoneId},
          ${goal.user_id},
          ${targetAreaId},
          ${goal.title},
          ${goal.description || null},
          ${goal.target_date || null},
          ${goal.created_at || new Date()},
          ${goal.updated_at || new Date()}
        )
      `
      milestonesCreated++
      console.log(`✅ Created milestone "${goal.title}" (${milestoneId}) from goal ${goal.id}`)
    }

    console.log(`✅ Created ${milestonesCreated} milestones`)

    // Step 5: Update steps - remove goal_id, ensure area_id
    console.log('📋 Step 5: Updating steps - removing goal_id, ensuring area_id...')
    
    // Get all steps with goal_id
    const stepsWithGoalId = await sql`
      SELECT id, goal_id, area_id FROM daily_steps WHERE goal_id IS NOT NULL
    `
    console.log(`Found ${stepsWithGoalId.length} steps with goal_id`)

    let stepsUpdated = 0
    for (const step of stepsWithGoalId) {
      let targetAreaId = step.area_id

      // If step doesn't have area_id, get it from the goal
      if (!targetAreaId) {
        const goal = allGoals.find((g: any) => g.id === step.goal_id)
        if (goal) {
          targetAreaId = goal.area_id || areaIdMap.get(goal.id)
        }
      }

      // If still no area_id, skip (shouldn't happen)
      if (!targetAreaId) {
        console.warn(`⚠️ Skipping step ${step.id} - no area_id available`)
        continue
      }

      // Update step: set area_id, remove goal_id
      await sql`
        UPDATE daily_steps
        SET area_id = ${targetAreaId}, goal_id = NULL
        WHERE id = ${step.id}
      `
      stepsUpdated++
    }

    console.log(`✅ Updated ${stepsUpdated} steps`)

    // Step 6: Delete goal_metrics
    console.log('📋 Step 6: Deleting goal_metrics...')
    const metricsCountResult = await sql`
      SELECT COUNT(*) as count FROM goal_metrics
    `
    const metricsCount = parseInt(metricsCountResult[0]?.count || '0')
    
    await sql`
      DELETE FROM goal_metrics
    `
    console.log(`✅ Deleted ${metricsCount} goal_metrics`)

    // Step 7: Summary
    const summary = {
      goalsProcessed: allGoals.length,
      areasCreated: goalsWithoutArea.length,
      milestonesCreated,
      stepsUpdated,
      metricsDeleted: metricsCount
    }

    console.log('✅ Migration completed successfully!')
    console.log('Summary:', summary)

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      summary
    })
  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
