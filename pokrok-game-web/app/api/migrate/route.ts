import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper function to run migrations
async function runMigrations() {
  try {
    // First, ensure automations table exists with all required columns
    // Check if table exists, if not create it
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'automations'
      )
    `
    
    if (!tableExists[0]?.exists) {
      // Create table from scratch
      await sql`
        CREATE TABLE automations (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(10) NOT NULL CHECK (type IN ('metric', 'step', 'milestone')),
          target_id VARCHAR(255) NOT NULL,
          frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('one-time', 'recurring')),
          frequency_time VARCHAR(100),
          scheduled_date TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT TRUE,
          target_value DECIMAL(10,2),
          current_value DECIMAL(10,2) DEFAULT 0,
          update_value DECIMAL(10,2),
          update_frequency VARCHAR(20) CHECK (update_frequency IN ('daily', 'weekly', 'monthly')),
          update_day_of_week INTEGER CHECK (update_day_of_week >= 0 AND update_day_of_week <= 6),
          update_day_of_month INTEGER CHECK (update_day_of_month >= 1 AND update_day_of_month <= 31),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } else {
      // Table exists, add missing columns
      // Check which columns exist
      const existingColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'automations'
      `
      const columnNames = existingColumns.map((row: any) => row.column_name)
      
      // Add all required columns if they don't exist
      if (!columnNames.includes('target_id')) {
        await sql`ALTER TABLE automations ADD COLUMN target_id VARCHAR(255)`
      }
      if (!columnNames.includes('type')) {
        await sql`ALTER TABLE automations ADD COLUMN type VARCHAR(10) DEFAULT 'milestone'`
      }
      if (!columnNames.includes('frequency_type')) {
        await sql`ALTER TABLE automations ADD COLUMN frequency_type VARCHAR(20) DEFAULT 'recurring'`
      }
      if (!columnNames.includes('frequency_time')) {
        await sql`ALTER TABLE automations ADD COLUMN frequency_time VARCHAR(100)`
      }
      if (!columnNames.includes('scheduled_date')) {
        await sql`ALTER TABLE automations ADD COLUMN scheduled_date TIMESTAMP WITH TIME ZONE`
      }
      if (!columnNames.includes('is_active')) {
        await sql`ALTER TABLE automations ADD COLUMN is_active BOOLEAN DEFAULT TRUE`
      }
      if (!columnNames.includes('target_value')) {
        await sql`ALTER TABLE automations ADD COLUMN target_value DECIMAL(10,2)`
      }
      if (!columnNames.includes('current_value')) {
        await sql`ALTER TABLE automations ADD COLUMN current_value DECIMAL(10,2) DEFAULT 0`
      }
      if (!columnNames.includes('update_value')) {
        await sql`ALTER TABLE automations ADD COLUMN update_value DECIMAL(10,2)`
      }
      if (!columnNames.includes('update_frequency')) {
        await sql`ALTER TABLE automations ADD COLUMN update_frequency VARCHAR(20)`
      }
      if (!columnNames.includes('update_day_of_week')) {
        await sql`ALTER TABLE automations ADD COLUMN update_day_of_week INTEGER`
      }
      if (!columnNames.includes('update_day_of_month')) {
        await sql`ALTER TABLE automations ADD COLUMN update_day_of_month INTEGER`
      }
      
      // Handle trigger_type if it exists - set default value if NULL
      if (columnNames.includes('trigger_type')) {
        // First check what values are allowed by checking the constraint
        const triggerConstraintCheck = await sql`
          SELECT check_clause 
          FROM information_schema.check_constraints 
          WHERE constraint_name = 'automations_trigger_type_check'
        `
        
        let defaultTriggerType = 'manual'
        if (triggerConstraintCheck.length > 0) {
          const checkClause = triggerConstraintCheck[0].check_clause
          // Extract first allowed value from constraint
          const match = checkClause.match(/'([^']+)'/)
          if (match) {
            defaultTriggerType = match[1]
          }
        }
        
        try {
          await sql`UPDATE automations SET trigger_type = ${defaultTriggerType} WHERE trigger_type IS NULL`
          await sql`ALTER TABLE automations ALTER COLUMN trigger_type SET DEFAULT ${defaultTriggerType}`
        } catch (e: any) {
          console.log('Could not set trigger_type default:', e?.message)
        }
      }
      
      // Handle action_type if it exists - set default value if NULL
      if (columnNames.includes('action_type')) {
        // First check what values are allowed by checking the constraint
        const constraintCheck = await sql`
          SELECT check_clause 
          FROM information_schema.check_constraints 
          WHERE constraint_name = 'automations_action_type_check'
        `
        
        let defaultActionType = 'create'
        if (constraintCheck.length > 0) {
          const checkClause = constraintCheck[0].check_clause
          // Try to extract allowed values from constraint
          if (checkClause.includes("'create'")) {
            defaultActionType = 'create'
          } else if (checkClause.includes("'update'")) {
            defaultActionType = 'update'
          } else if (checkClause.includes("'notify'")) {
            defaultActionType = 'notify'
          }
        }
        
        try {
          await sql`UPDATE automations SET action_type = ${defaultActionType} WHERE action_type IS NULL`
          await sql`ALTER TABLE automations ALTER COLUMN action_type SET DEFAULT ${defaultActionType}`
        } catch (e: any) {
          console.log('Could not set action_type default:', e?.message)
        }
      }
      
      // Set default values for existing rows
      await sql`UPDATE automations SET target_id = '' WHERE target_id IS NULL`
      await sql`UPDATE automations SET type = 'milestone' WHERE type IS NULL`
      await sql`UPDATE automations SET frequency_type = 'recurring' WHERE frequency_type IS NULL`
      await sql`UPDATE automations SET is_active = TRUE WHERE is_active IS NULL`
      await sql`UPDATE automations SET current_value = 0 WHERE current_value IS NULL`
      
      // Try to set NOT NULL constraints (will fail silently if constraint already exists)
      try {
        await sql`ALTER TABLE automations ALTER COLUMN target_id SET NOT NULL`
      } catch (e: any) {}
      try {
        await sql`ALTER TABLE automations ALTER COLUMN type SET NOT NULL`
      } catch (e: any) {}
      try {
        await sql`ALTER TABLE automations ALTER COLUMN frequency_type SET NOT NULL`
      } catch (e: any) {}
      
      // Update constraints
      await sql`ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_type_check`
      await sql`ALTER TABLE automations ADD CONSTRAINT automations_type_check CHECK (type IN ('metric', 'step', 'milestone'))`
      
      await sql`ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_frequency_type_check`
      await sql`ALTER TABLE automations ADD CONSTRAINT automations_frequency_type_check CHECK (frequency_type IN ('one-time', 'recurring'))`
    }
    
    // Add checklist column to daily_steps table
    const dailyStepsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'daily_steps'
    `
    const dailyStepsColumnNames = dailyStepsColumns.map((row: any) => row.column_name)
    
    if (!dailyStepsColumnNames.includes('checklist')) {
      await sql`ALTER TABLE daily_steps ADD COLUMN checklist JSONB DEFAULT '[]'::jsonb`
    }
    
    if (!dailyStepsColumnNames.includes('require_checklist_complete')) {
      await sql`ALTER TABLE daily_steps ADD COLUMN require_checklist_complete BOOLEAN DEFAULT FALSE`
    }
    
    // Add date_format column to user_settings table
    const userSettingsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_settings'
    `
    const userSettingsColumnNames = userSettingsColumns.map((row: any) => row.column_name)
    
    if (!userSettingsColumnNames.includes('date_format')) {
      await sql`ALTER TABLE user_settings ADD COLUMN date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY'`
    }
    
    // Update goals status constraint to include 'paused'
    try {
      // Drop existing constraint if it exists
      await sql`ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check`
      // Add new constraint with 'paused' included
      await sql`ALTER TABLE goals ADD CONSTRAINT goals_status_check CHECK (status IN ('active', 'completed', 'paused', 'cancelled'))`
    } catch (e: any) {
      console.log('Note: Could not update goals status constraint:', e?.message)
      // Try alternative constraint name
      try {
        await sql`ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check1`
        await sql`ALTER TABLE goals ADD CONSTRAINT goals_status_check CHECK (status IN ('active', 'completed', 'paused', 'cancelled'))`
      } catch (e2: any) {
        console.log('Note: Could not update goals status constraint with alternative name:', e2?.message)
      }
    }
    
    return { success: true, message: 'Migration completed successfully' }
  } catch (error: any) {
    console.error('Migration error:', error)
    return { 
      success: false, 
      error: error?.message || 'Migration failed',
      details: error 
    }
  }
}

// GET - Run database migrations (for browser access)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runMigrations()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error running migration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Run database migrations
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runMigrations()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error running migration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

