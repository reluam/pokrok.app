import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, createUser, createGoalMetric } from '@/lib/cesta-db'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')


// Force dynamic rendering
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting goal creation with new structure...')
    
    // Ensure goal_milestones table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS goal_milestones (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP WITH TIME ZONE,
          "order" INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      // Create indexes if they don't exist
      await sql`CREATE INDEX IF NOT EXISTS idx_goal_milestones_user_id ON goal_milestones(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_goal_milestones_completed ON goal_milestones(completed)`
      console.log('✅ goal_milestones table ensured')
    } catch (tableError) {
      console.error('⚠️ Error ensuring goal_milestones table:', tableError)
      // Continue anyway - table might already exist
    }
    
    const { userId } = await auth()
    if (!userId) {
      console.log('❌ No user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      title,
      description,
      targetDate,
      icon,
      areaId,
      aspirationId,
      metrics,
      steps,
      milestones
    } = await request.json()
    
    console.log('📝 Goal data:', { 
      title, 
      description, 
      targetDate, 
      metricsCount: metrics?.length || 0,
      stepsCount: steps?.length || 0,
      milestonesCount: milestones?.length || 0
    })

    // Get or create user
    let dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      console.log('👤 Creating new user...')
      // Create user if doesn't exist
      const { currentUser } = await import('@clerk/nextjs/server')
      const user = await currentUser()
      if (!user) {
        console.log('❌ No current user')
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      dbUser = await createUser(userId, user.emailAddresses[0].emailAddress, `${user.firstName || ''} ${user.lastName || ''}`.trim())
      console.log('✅ User created:', dbUser.id)
    } else {
      console.log('👤 Using existing user:', dbUser.id)
    }

    // Create goal
    const goalId = randomUUID()
    const targetDateObj = targetDate ? new Date(targetDate) : null
    
    console.log('🎯 Creating goal:', { title, description, targetDate, targetDateObj })
    
    const goal = await sql`
      INSERT INTO goals (
        id, user_id, title, description, target_date, status, priority, 
        category, goal_type, progress_percentage, icon, area_id, aspiration_id
      ) VALUES (
        ${goalId}, ${dbUser.id}, ${title}, ${description || null}, ${targetDateObj}, 'active',
        'meaningful', 'medium-term', 'outcome', 0, ${icon || null}, ${areaId || null}, ${aspirationId || null}
      ) RETURNING *
    `

    const createdGoal = goal[0]
    console.log('✅ Goal created:', createdGoal.id)

    // Create goal metrics
    const createdMetrics = []
    if (metrics && metrics.length > 0) {
      console.log('📊 Creating goal metrics...')
      for (const metricData of metrics) {
        if (metricData.name && metricData.name.trim()) {
          const metric = await createGoalMetric({
            user_id: dbUser.id,
            goal_id: goalId,
            name: metricData.name,
            description: metricData.description,
            type: metricData.type,
            unit: metricData.unit,
            target_value: metricData.targetValue,
            current_value: metricData.currentValue
          })
          createdMetrics.push(metric)
          console.log('✅ Goal metric created:', metric.id)
        }
      }
    }

    // Create steps (simplified - no metrics or automations)
    const createdSteps = []
    if (steps && steps.length > 0) {
      console.log('📝 Creating steps...')
      for (const stepData of steps) {
        if (stepData.title && stepData.title.trim()) {
          const stepId = randomUUID()
          const step = await sql`
            INSERT INTO daily_steps (
              id, user_id, goal_id, title, description, completed, 
              date, is_important, is_urgent, aspiration_id
            ) VALUES (
              ${stepId}, ${dbUser.id}, ${goalId}, ${stepData.title}, 
              ${stepData.description || null}, false, ${targetDateObj || new Date()}, 
              false, false, ${aspirationId || null}
            ) RETURNING 
              id, user_id, goal_id, title, description, completed, 
              TO_CHAR(date, 'YYYY-MM-DD') as date,
              is_important, is_urgent, aspiration_id, 
              estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
          `
          createdSteps.push(step[0])
          console.log('✅ Step created:', step[0].id)
        }
      }
    }

    // Create milestones
    const createdMilestones = []
    if (milestones && milestones.length > 0) {
      console.log('🏆 Creating milestones...')
      for (let index = 0; index < milestones.length; index++) {
        const milestoneData = milestones[index]
        if (milestoneData.title && milestoneData.title.trim()) {
          const milestoneId = randomUUID()
          const milestone = await sql`
            INSERT INTO goal_milestones (
              id, user_id, goal_id, title, description, completed, "order"
            ) VALUES (
              ${milestoneId}, ${dbUser.id}, ${goalId}, ${milestoneData.title}, 
              ${milestoneData.description || null}, false, ${index}
            ) RETURNING *
          `
          createdMilestones.push(milestone[0])
          console.log('✅ Milestone created:', milestone[0].id)
        }
      }
    }

    console.log('🎉 Goal creation completed successfully')
    return NextResponse.json({ 
      success: true,
      goal: createdGoal, 
      metrics: createdMetrics,
      steps: createdSteps,
      milestones: createdMilestones
    })
  } catch (error) {
    console.error('❌ Error creating goal:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to create goal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

