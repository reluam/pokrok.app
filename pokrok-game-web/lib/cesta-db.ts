import { neon } from '@neondatabase/serverless'
import { encrypt, decryptFields, encryptFields, encryptChecklist, decryptChecklist, clearEncryptionKeyCache } from './encryption'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Request-scoped cache for getUserByClerkId
// Using a simple Map that's cleared after each request
// This is safe because each request has its own isolated cache
const userCache = new Map<string, { user: any, timestamp: number }>()
const USER_CACHE_TTL = 60000 // 60 seconds - user data changes infrequently
const MAX_CACHE_SIZE = 1000 // Prevent memory leaks

// Cache for getHabitsByUserId (optimized TTL for better performance)
const habitsCache = new Map<string, { habits: any[], timestamp: number }>()
const HABITS_CACHE_TTL = 5000 // 5 seconds - short TTL to ensure fresh data after updates

// Cache for getGoalsByUserId (optimized TTL for better performance)
const goalsCache = new Map<string, { goals: any[], timestamp: number }>()
const GOALS_CACHE_TTL = 5000 // 5 seconds - short TTL to ensure fresh data after updates

function cleanupCache() {
  const now = Date.now()
  const entries = Array.from(userCache.entries())
  for (const [key, value] of entries) {
    if (now - value.timestamp > USER_CACHE_TTL) {
      userCache.delete(key)
    }
  }
  // If cache is too large, clear oldest entries
  if (userCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(userCache.entries())
    sortedEntries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = sortedEntries.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
    for (const [key] of toDelete) {
      userCache.delete(key)
    }
  }
}

function cleanupHabitsCache() {
  const now = Date.now()
  const entries = Array.from(habitsCache.entries())
  for (const [key, value] of entries) {
    if (now - value.timestamp > HABITS_CACHE_TTL) {
      habitsCache.delete(key)
    }
  }
  // If cache is too large, clear oldest entries
  if (habitsCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(habitsCache.entries())
    sortedEntries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = sortedEntries.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
    for (const [key] of toDelete) {
      habitsCache.delete(key)
    }
  }
}

function cleanupGoalsCache() {
  const now = Date.now()
  const entries = Array.from(goalsCache.entries())
  for (const [key, value] of entries) {
    if (now - value.timestamp > GOALS_CACHE_TTL) {
      goalsCache.delete(key)
    }
  }
  // If cache is too large, clear oldest entries
  if (goalsCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(goalsCache.entries())
    sortedEntries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = sortedEntries.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
    for (const [key] of toDelete) {
      goalsCache.delete(key)
    }
  }
}

export interface User {
  id: string
  clerk_user_id: string
  email: string
  name: string
  has_completed_onboarding: boolean
  preferred_locale?: string | null
  is_admin?: boolean
  created_at: Date
  updated_at: Date
}

export interface Area {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon?: string
  order: number
  created_at: Date
  updated_at: Date
}

export interface Aspiration {
  id: string
  user_id: string
  title: string
  description?: string
  color: string
  icon?: string
  created_at: Date
  updated_at: Date
}

export interface Value {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  is_custom: boolean
  level: number
  experience: number
  created_at: Date
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  target_date?: string | Date
  start_date?: string | Date
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  priority: 'meaningful' | 'nice-to-have'
  category: 'short-term' | 'medium-term' | 'long-term'
  goal_type: 'process' | 'outcome'
  progress_percentage: number
  progress_type: 'percentage' | 'count' | 'amount' | 'steps'
  progress_target?: number
  progress_current?: number
  progress_unit?: string
  progress_calculation_type?: 'metrics' | 'metrics_and_steps'
  icon?: string
  area_id?: string
  aspiration_id?: string
  focus_status?: 'active_focus' | 'deferred' | null
  focus_order?: number | null
  created_at: string | Date
  updated_at: string | Date
}

export interface ChecklistItem {
  id: string
  title: string
  completed: boolean
}

export interface DailyStep {
  id: string
  user_id: string
  goal_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: Date
  date: Date | null
  is_important: boolean
  is_urgent: boolean
  created_at: Date
  aspiration_id?: string
  deadline?: Date
  area_id?: string
  isCompleting?: boolean // Loading state for completion
  estimated_time?: number
  xp_reward?: number
  checklist?: ChecklistItem[]
  require_checklist_complete?: boolean
  frequency?: string | null
  selected_days?: string[]
}

export interface GoalMetric {
  id: string
  user_id: string
  goal_id: string
  name: string
  description?: string
  type: 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'weight' | 'custom'
  unit: string | null
  target_value: number
  current_value: number
  initial_value: number
  incremental_value: number
  created_at: Date
  updated_at: Date
}


export interface Note {
  id: string
  user_id: string
  goal_id?: string // Optional - can be assigned to a goal or be standalone
  title: string
  content: string
  created_at: Date
  updated_at: Date
}

export interface Event {
  id: string
  user_id: string
  goal_id: string
  automation_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: Date
  date: Date
  is_important: boolean
  is_urgent: boolean
  created_at: Date
  event_type: 'metric_update' | 'step_reminder'
  target_step_id?: string
  update_value?: number
  update_unit?: string
}

export interface EventInteraction {
  id: string
  user_id: string
  automation_id: string
  date: Date
  status: 'completed' | 'postponed' | 'pending'
  postponed_to?: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Automation {
  id: string
  user_id: string
  name: string
  description?: string
  type: 'metric' | 'step'
  target_id: string
  frequency_type: 'one-time' | 'recurring'
  frequency_time?: string
  scheduled_date?: Date
  is_active: boolean
  target_value?: number | null
  current_value?: number | null
  update_value?: number | null
  update_frequency?: 'daily' | 'weekly' | 'monthly' | null
  update_day_of_week?: number | null // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  update_day_of_month?: number | null
  created_at: Date
  updated_at: Date
}

export interface CategorySettings {
  id: string
  user_id: string
  short_term_days: number
  long_term_days: number
  created_at: Date
  updated_at: Date
}

export interface NeededStepsSettings {
  id: string
  user_id: string
  enabled: boolean
  days_of_week: number[]
  time_hour: number
  time_minute: number
  created_at: Date
  updated_at: Date
}

export interface Player {
  id: string
  user_id: string
  name: string
  gender: 'male' | 'female' | 'other'
  avatar: string
  appearance: {
    hairColor: string
    skinColor: string
    eyeColor: string
  }
  level: number
  experience: number
  energy: number
  current_day: number
  current_time: number
  created_at: Date
  updated_at: Date
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  streak: number
  max_streak: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  is_custom: boolean
  reminder_time: string | null
  notification_enabled?: boolean
  selected_days: string[] | null
  habit_completions: { [date: string]: boolean | null } | null
  xp_reward: number
  aspiration_id?: string
  area_id?: string
  icon: string | null
  start_date?: string | Date
  created_at: Date
  updated_at: Date
}

export interface UserSettings {
  id: string
  user_id: string
  daily_steps_count: number
  workflow: 'daily_planning' | 'no_workflow'
  daily_reset_hour: number
  default_view?: 'day' | 'week' | 'month' | 'year'
  date_format?: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY'
  primary_color?: string
  default_currency?: string
  weight_unit_preference?: 'kg' | 'lbs'
  assistant_enabled?: boolean
  filters?: {
    showToday: boolean
    showOverdue: boolean
    showFuture: boolean
    showWithGoal: boolean
    showWithoutGoal: boolean
    sortBy: 'date' | 'priority' | 'title'
  }
  created_at: Date
  updated_at: Date
}

export interface DailyPlanning {
  id: string
  user_id: string
  date: Date
  planned_steps: string[] // Array of step IDs
  completed_steps: string[] // Array of completed step IDs
  created_at: Date
  updated_at: Date
}

export interface UserStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: Date
  created_at: Date
  updated_at: Date
}

export interface DailyStats {
  id: string
  user_id: string
  date: Date
  planned_steps_count: number
  completed_steps_count: number
  total_steps_count: number
  optimum_deviation: number // How many steps over/under the daily target
  created_at: Date
  updated_at: Date
}

export async function initializeCestaDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        has_completed_onboarding BOOLEAN DEFAULT FALSE,
        preferred_locale VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Add preferred_locale column if it doesn't exist (for existing databases)
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10)
    `
    
    // Add is_admin column if it doesn't exist (for existing databases)
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
    `

    // Create help categories (admin-managed)
    await sql`
      CREATE TABLE IF NOT EXISTS help_categories (
        id VARCHAR(255) PRIMARY KEY,
        title JSONB NOT NULL, -- {cs: "...", en: "..."}
        description JSONB,    -- optional {cs: "...", en: "..."}
        slug VARCHAR(100) UNIQUE, -- optional stable identifier
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create help sections belonging to categories
    await sql`
      CREATE TABLE IF NOT EXISTS help_sections (
        id VARCHAR(255) PRIMARY KEY,
        category_id VARCHAR(255) NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
        title JSONB NOT NULL,        -- {cs: "...", en: "..."}
        content JSONB,               -- {cs: "markdown/text", en: "..."}
        component_key VARCHAR(100),  -- optional component to render on client
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
        avatar VARCHAR(255) DEFAULT 'default',
        appearance JSONB NOT NULL DEFAULT '{}',
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        energy INTEGER DEFAULT 100,
        current_day INTEGER DEFAULT 1,
        "current_time" INTEGER DEFAULT 6,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create habits table
    await sql`
      CREATE TABLE IF NOT EXISTS habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
        streak INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        category VARCHAR(255) NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
        is_custom BOOLEAN DEFAULT FALSE,
        reminder_time VARCHAR(10),
        selected_days TEXT[],
        xp_reward INTEGER DEFAULT 0,
        aspiration_id VARCHAR(255) REFERENCES aspirations(id) ON DELETE SET NULL,
        area_id VARCHAR(255) REFERENCES areas(id) ON DELETE SET NULL,
        icon VARCHAR(50),
        start_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Add start_date column if it doesn't exist (migration for existing databases)
    try {
      await sql`
        ALTER TABLE habits 
        ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE
      `
    } catch (error) {
      // Column might already exist, ignore error
      console.log('start_date column check:', error)
    }

    // Create habit_completions table
    await sql`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        habit_id VARCHAR(255) NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completion_date DATE NOT NULL,
        completed BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, habit_id, completion_date)
      )
    `

    // Create values table
    await sql`
      CREATE TABLE IF NOT EXISTS values (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        is_custom BOOLEAN DEFAULT FALSE,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create aspirations table
    await sql`
      CREATE TABLE IF NOT EXISTS aspirations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        icon VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create goals table
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        priority VARCHAR(20) DEFAULT 'meaningful' CHECK (priority IN ('meaningful', 'nice-to-have')),
        category VARCHAR(20) DEFAULT 'medium-term' CHECK (category IN ('short-term', 'medium-term', 'long-term')),
        goal_type VARCHAR(20) DEFAULT 'outcome' CHECK (goal_type IN ('process', 'outcome')),
        progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
        progress_type VARCHAR(20) DEFAULT 'percentage' CHECK (progress_type IN ('percentage', 'count', 'amount', 'steps')),
        progress_target INTEGER,
        progress_current INTEGER DEFAULT 0,
        progress_unit VARCHAR(50),
        icon VARCHAR(50),
        area_id VARCHAR(255) REFERENCES areas(id) ON DELETE SET NULL,
        aspiration_id VARCHAR(255) REFERENCES aspirations(id) ON DELETE SET NULL,
        focus_status VARCHAR(20) DEFAULT NULL CHECK (focus_status IN ('active_focus', 'deferred') OR focus_status IS NULL),
        focus_order INTEGER DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create daily_steps table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_steps (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_id VARCHAR(255) REFERENCES goals(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        date DATE NOT NULL,
        is_important BOOLEAN DEFAULT FALSE,
        is_urgent BOOLEAN DEFAULT FALSE,
        aspiration_id VARCHAR(255) REFERENCES aspirations(id) ON DELETE SET NULL,
        area_id VARCHAR(255) REFERENCES areas(id) ON DELETE SET NULL,
        deadline DATE,
        estimated_time INTEGER DEFAULT 30,
        xp_reward INTEGER DEFAULT 1,
        checklist JSONB DEFAULT '[]'::jsonb,
        require_checklist_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create goal_metrics table (for goal-level metrics)
    await sql`
      CREATE TABLE IF NOT EXISTS goal_metrics (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'currency', 'percentage', 'distance', 'time', 'weight', 'custom')),
        unit VARCHAR(50) NOT NULL,
        target_value DECIMAL(10,2) NOT NULL,
        current_value DECIMAL(10,2) DEFAULT 0,
        incremental_value DECIMAL(10,2) DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Ensure incremental_value column exists (for existing tables)
    try {
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'goal_metrics' AND column_name = 'incremental_value'
      `
      if (columnCheck.length === 0) {
        await sql`ALTER TABLE goal_metrics ADD COLUMN incremental_value DECIMAL(10,2) DEFAULT 1`
      }
    } catch (e: any) {
      console.warn('Could not ensure incremental_value column exists:', e?.message)
    }
    
    // Ensure initial_value column exists (for existing tables)
    try {
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'goal_metrics' AND column_name = 'initial_value'
      `
      if (columnCheck.length === 0) {
        await sql`ALTER TABLE goal_metrics ADD COLUMN initial_value DECIMAL(10,2) DEFAULT 0`
      }
    } catch (e: any) {
      console.warn('Could not ensure initial_value column exists:', e?.message)
    }


    // Create automations table
    await sql`
      CREATE TABLE IF NOT EXISTS automations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(10) NOT NULL CHECK (type IN ('metric', 'step')),
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
    
    // Add new columns if they don't exist (for existing databases)
    try {
      // Add type column if it doesn't exist (for older database schemas)
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'goal'`
      await sql`UPDATE automations SET type = 'goal' WHERE type IS NULL OR type = 'milestone'`
      // Try to set NOT NULL - will fail silently if constraint already exists
      try {
        await sql`ALTER TABLE automations ALTER COLUMN type SET NOT NULL`
      } catch (e: any) {
        // Ignore if constraint already exists
      }
      
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS target_value DECIMAL(10,2)`
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS current_value DECIMAL(10,2) DEFAULT 0`
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS update_value DECIMAL(10,2)`
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS update_frequency VARCHAR(20)`
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS update_day_of_week INTEGER`
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS update_day_of_month INTEGER`
      // Update type constraint
      await sql`ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_type_check`
      await sql`ALTER TABLE automations ADD CONSTRAINT automations_type_check CHECK (type IN ('metric', 'step'))`
    } catch (e) {
      // Columns might already exist, ignore error
      console.log('Note: Some automation columns may already exist:', e)
    }

    // Add focus fields to goals table if they don't exist (for existing databases)
    try {
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS focus_status VARCHAR(20) DEFAULT NULL`
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS focus_order INTEGER DEFAULT NULL`
      // Add check constraint if it doesn't exist
      try {
        await sql`ALTER TABLE goals ADD CONSTRAINT check_focus_status CHECK (focus_status IN ('active_focus', 'deferred') OR focus_status IS NULL)`
      } catch (e: any) {
        // Constraint might already exist, ignore
        if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
          console.log('Note: Focus status constraint may already exist:', e)
        }
      }
    } catch (e) {
      // Columns might already exist, ignore error
      console.log('Note: Focus columns may already exist:', e)
    }

    // Create events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        automation_id VARCHAR(255) NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        date DATE NOT NULL,
        is_important BOOLEAN DEFAULT FALSE,
        is_urgent BOOLEAN DEFAULT FALSE,
        event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('metric_update', 'step_reminder')),
        target_step_id VARCHAR(255) REFERENCES daily_steps(id) ON DELETE CASCADE,
        update_value DECIMAL(10,2),
        update_unit VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create category_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS category_settings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        short_term_days INTEGER NOT NULL DEFAULT 90,
        long_term_days INTEGER NOT NULL DEFAULT 365,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `

    // Create needed_steps_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS needed_steps_settings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        enabled BOOLEAN DEFAULT FALSE,
        days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
        time_hour INTEGER DEFAULT 9,
        time_minute INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `

    // Create user_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        daily_steps_count INTEGER DEFAULT 3,
        workflow VARCHAR(20) DEFAULT 'daily_planning' CHECK (workflow IN ('daily_planning', 'no_workflow')),
        daily_reset_hour INTEGER DEFAULT 0,
        filters JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `
    
    // Add missing columns if they don't exist (migration)
    try {
      // Check if workflow column exists
      const workflowCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'workflow'
      `
      if (workflowCheck.length === 0) {
        await sql`ALTER TABLE user_settings ADD COLUMN workflow VARCHAR(20) DEFAULT 'daily_planning'`
        await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_workflow_check CHECK (workflow IN ('daily_planning', 'no_workflow'))`
      }
      
      // Check if daily_reset_hour column exists
      const resetHourCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'daily_reset_hour'
      `
      if (resetHourCheck.length === 0) {
        await sql`ALTER TABLE user_settings ADD COLUMN daily_reset_hour INTEGER DEFAULT 0`
      }
      
      // Check if filters column exists
      const filtersCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'filters'
      `
      if (filtersCheck.length === 0) {
        await sql`ALTER TABLE user_settings ADD COLUMN filters JSONB`
      }
      
      // Check if default_view column exists
      try {
        await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_view VARCHAR(10) DEFAULT 'day'`
        // Add check constraint if it doesn't exist
        await sql`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'user_settings_default_view_check'
            ) THEN
              ALTER TABLE user_settings 
              ADD CONSTRAINT user_settings_default_view_check 
              CHECK (default_view IN ('day', 'week', 'month', 'year'));
            END IF;
          END $$;
        `
      } catch (error) {
        // Column might already exist, ignore error
        console.log('Note: default_view column migration:', error instanceof Error ? error.message : 'unknown error')
      }
      
      // Check if default_currency column exists
      try {
        await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_currency VARCHAR(10)`
      } catch (error) {
        console.log('Note: default_currency column migration:', error instanceof Error ? error.message : 'unknown error')
      }
      
      // Check if weight_unit_preference column exists
      try {
        await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS weight_unit_preference VARCHAR(5) DEFAULT 'kg' CHECK (weight_unit_preference IN ('kg', 'lbs'))`
      } catch (error) {
        console.log('Note: weight_unit_preference column migration:', error instanceof Error ? error.message : 'unknown error')
      }
    } catch (error) {
      // Ignore errors if columns already exist or other migration issues
      console.error('Error adding user_settings columns:', error)
    }

    // Create assistant_tips table
    await sql`
      CREATE TABLE IF NOT EXISTS assistant_tips (
        id VARCHAR(255) PRIMARY KEY,
        title JSONB NOT NULL,
        description JSONB NOT NULL,
          category VARCHAR(50) NOT NULL CHECK (category IN ('motivation', 'organization', 'productivity', 'feature', 'onboarding', 'inspiration')),
        priority INTEGER DEFAULT 0,
        context_page VARCHAR(50),
        context_section VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create daily_planning table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_planning (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        planned_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
        completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      )
    `

    // Create user_streak table
    await sql`
      CREATE TABLE IF NOT EXISTS user_streak (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `


    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_values_user_id ON values(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_values_is_custom ON values(is_custom)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`

    // Create search indexes for assistant search optimization
    try {
      // Indexes for daily_steps (title and description search)
      await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_title_search ON daily_steps(user_id, title text_pattern_ops)`
      await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_description_search ON daily_steps(user_id, description text_pattern_ops)`
      
      // Indexes for goals (title and description search)
      await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_title_search ON goals(user_id, title text_pattern_ops)`
      await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_description_search ON goals(user_id, description text_pattern_ops)`
      
      // Indexes for areas (name and description search)
      await sql`CREATE INDEX IF NOT EXISTS idx_areas_user_name_search ON areas(user_id, name text_pattern_ops)`
      await sql`CREATE INDEX IF NOT EXISTS idx_areas_user_description_search ON areas(user_id, description text_pattern_ops)`
      
      // Indexes for habits (name and description search)
      await sql`CREATE INDEX IF NOT EXISTS idx_habits_user_name_search ON habits(user_id, name text_pattern_ops)`
      await sql`CREATE INDEX IF NOT EXISTS idx_habits_user_description_search ON habits(user_id, description text_pattern_ops)`
      
      console.log('✓ Assistant search indexes created/verified')
    } catch (indexError) {
      console.error('Error creating assistant search indexes:', indexError)
      // Don't fail initialization if indexes fail
    }
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_focus_status ON goals(focus_status) WHERE focus_status IS NOT NULL`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_focus_order ON goals(focus_order) WHERE focus_order IS NOT NULL`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_id ON daily_steps(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_goal_id ON daily_steps(goal_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_date ON daily_steps(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_completed ON daily_steps(completed)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_deadline ON daily_steps(deadline)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goal_metrics_user_id ON goal_metrics(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goal_metrics_goal_id ON goal_metrics(goal_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_automations_target_id ON automations(target_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_automations_active ON automations(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_events_goal_id ON events(goal_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_events_automation_id ON events(automation_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_events_completed ON events(completed)`
    await sql`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_category_settings_user_id ON category_settings(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_planning_user_id ON daily_planning(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_planning_date ON daily_planning(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_streak_user_id ON user_streak(user_id)`

    // Insert default values library
    await sql`
      INSERT INTO values (id, user_id, name, description, color, icon, is_custom) VALUES
      ('default-freedom', 'system', 'Svoboda', 'Možnost volby a nezávislost', '#3B82F6', 'compass', false),
      ('default-family', 'system', 'Rodina', 'Blízké vztahy a péče o blízké', '#10B981', 'heart', false),
      ('default-creativity', 'system', 'Kreativita', 'Tvořivost a sebevyjádření', '#F59E0B', 'palette', false),
      ('default-growth', 'system', 'Růst', 'Osobní rozvoj a učení', '#8B5CF6', 'trending-up', false),
      ('default-health', 'system', 'Zdraví', 'Fyzické a duševní zdraví', '#EF4444', 'heart-pulse', false),
      ('default-career', 'system', 'Kariéra', 'Profesní úspěch a naplnění', '#06B6D4', 'briefcase', false),
      ('default-adventure', 'system', 'Dobrodružství', 'Nové zkušenosti a výzvy', '#84CC16', 'map', false),
      ('default-peace', 'system', 'Klid', 'Vnitřní mír a harmonie', '#6B7280', 'moon', false)
      ON CONFLICT (id) DO NOTHING
    `

    console.log('Cesta database initialized successfully')
  } catch (error) {
    console.error('Error initializing Cesta database:', error)
    throw error
  }
}

export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  try {
    // Check cache first
    cleanupCache()
    const cached = userCache.get(clerkUserId)
    if (cached && (Date.now() - cached.timestamp) < USER_CACHE_TTL) {
      return cached.user as User
    }

    // Fetch from database
    const users = await sql`
      SELECT * FROM users 
      WHERE clerk_user_id = ${clerkUserId}
      LIMIT 1
    `
    const user = users[0] as User || null
    
    // Cache the result (even if null to avoid repeated queries for non-existent users)
    if (userCache.size < MAX_CACHE_SIZE) {
      userCache.set(clerkUserId, { user, timestamp: Date.now() })
    }
    
    return user
  } catch (error) {
    console.error('Error fetching user by clerk ID:', error)
    return null
  }
}

// Function to invalidate cache for a specific user (call after user updates)
export function invalidateUserCache(clerkUserId: string): void {
  userCache.delete(clerkUserId)
}

// Function to invalidate cache by userId (requires DB lookup)
export async function invalidateUserCacheByUserId(userId: string): Promise<void> {
  try {
    const users = await sql`
      SELECT clerk_user_id FROM users WHERE id = ${userId} LIMIT 1
    `
    if (users.length > 0) {
      invalidateUserCache(users[0].clerk_user_id)
    }
  } catch (error) {
    // If lookup fails, cache will expire naturally after TTL
    console.error('Error invalidating user cache by userId:', error)
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await sql`
      SELECT * FROM users ORDER BY created_at DESC
    `
    return result as User[]
  } catch (error) {
    console.error('Error fetching all users:', error)
    return []
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // First check if is_admin column exists
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_admin'
      )
    `
    
    if (!columnExists[0]?.exists) {
      // Column doesn't exist yet, return false
      return false
    }

    // Column exists, check admin status
    const result = await sql`
      SELECT is_admin FROM users WHERE id = ${userId}
    `
    return result[0]?.is_admin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function createUser(clerkUserId: string, email: string, name: string, locale: string = 'cs'): Promise<User> {
  const id = crypto.randomUUID()
  
  // Ensure locale is valid ('cs' or 'en')
  const validLocale = (locale === 'en' || locale === 'cs') ? locale : 'cs'
  
  const user = await sql`
    INSERT INTO users (id, clerk_user_id, email, name, has_completed_onboarding, preferred_locale, is_admin)
    VALUES (${id}, ${clerkUserId}, ${email}, ${name}, false, ${validLocale}, false)
    RETURNING *
  `
  const newUser = user[0] as User
  
  // Invalidate cache for this user
  invalidateUserCache(clerkUserId)
  
  // Initialize onboarding steps for new user SYNCHRONOUSLY
  // This ensures the steps are created immediately when the user is created
  try {
    console.log('🔄 Initializing onboarding steps synchronously for user:', newUser.id, 'locale:', validLocale)
    const { initializeOnboardingSteps } = await import('./onboarding-helpers')
    await initializeOnboardingSteps(newUser.id, validLocale)
    console.log('✅ Onboarding steps initialized successfully for user:', newUser.id)
  } catch (error) {
    console.error('❌ Error initializing onboarding steps for new user:', error)
    // Log the error but don't fail user creation
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    // Continue - user creation should succeed even if onboarding init fails
  }
  
  return newUser
}

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  try {
    // Check cache first
    cleanupGoalsCache()
    const cached = goalsCache.get(userId)
    if (cached && (Date.now() - cached.timestamp) < GOALS_CACHE_TTL) {
      // Decrypt cached goals (cache stores encrypted data)
      return cached.goals.map((goal: any) => decryptFields(goal, userId, ['title', 'description'])) as Goal[]
    }

    const goals = await sql`
      SELECT g.*, a.name as area_name
      FROM goals g
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.user_id = ${userId}
      ORDER BY g.created_at DESC
    `
    
    // Decrypt all goals
    const goalsArray = goals.map(goal => decryptFields(goal, userId, ['title', 'description'])) as Goal[]
    
    // Check and update goal statuses based on start_date (async, don't wait)
    checkAndUpdateGoalsStatus(userId).catch(err => {
      console.error('Error updating goal statuses:', err)
    })
    
    // Cache the result (cache encrypted data)
    if (goalsCache.size < MAX_CACHE_SIZE) {
      goalsCache.set(userId, { goals: goals as Goal[], timestamp: Date.now() })
    }
    
    return goalsArray
  } catch (error) {
    console.error('Error fetching goals:', error)
    return []
  }
}

// Function to invalidate goals cache for a user (call after goal updates)
export function invalidateGoalsCache(userId: string): void {
  goalsCache.delete(userId)
}

// Function to check and update goal status based on start_date
// If start_date is in the future, set status to 'paused'
// If start_date is today or in the past, and status is 'paused', set to 'active'
async function checkAndUpdateGoalStatus(goal: Goal): Promise<Goal | null> {
  try {
    // Only check goals that are not completed
    if (goal.status === 'completed') {
      return goal
    }

    // If goal has no start_date, don't change status
    if (!goal.start_date) {
      return goal
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startDate = new Date(goal.start_date)
    startDate.setHours(0, 0, 0, 0)

    let newStatus: 'active' | 'paused' | undefined = undefined

    // If start_date is in the future, set to 'paused'
    if (startDate > today) {
      if (goal.status !== 'paused') {
        newStatus = 'paused'
      }
    }
    // If start_date is today or in the past, and status is 'paused', set to 'active'
    else if (startDate <= today && goal.status === 'paused') {
      newStatus = 'active'
    }

    // Update status if needed
    if (newStatus) {
      const updated = await updateGoalById(goal.id, { status: newStatus })
      return updated
    }

    return goal
  } catch (error) {
    console.error('Error checking goal status:', error)
    return goal
  }
}

// Function to check and update all goals for a user based on start_date
export async function checkAndUpdateGoalsStatus(userId: string): Promise<void> {
  try {
    const goals = await sql`
      SELECT g.*, a.name as area_name
      FROM goals g
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.user_id = ${userId}
      AND g.status != 'completed'
      AND g.start_date IS NOT NULL
    `
    
    // Update goals in parallel (but limit concurrency to avoid overwhelming the database)
    const updatePromises = (goals as Goal[]).map(goal => checkAndUpdateGoalStatus(goal))
    await Promise.all(updatePromises)
    
    // Invalidate cache after updates
    invalidateGoalsCache(userId)
  } catch (error) {
    console.error('Error checking goals status:', error)
  }
}

// MARK: - Aspiration Functions (REMOVED)

export async function getDailyStepsByUserId(
  userId: string, 
  date?: Date, 
  startDate?: string, 
  endDate?: string
): Promise<DailyStep[]> {
  try {
    let query
    if (date) {
      // Get steps for specific date
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
          checklist, COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
          TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
          TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date,
          TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
          TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
          recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
          parent_recurring_step_id,
          TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
        FROM daily_steps 
        WHERE user_id = ${userId}
        AND (
          -- Non-recurring steps with date in range
          (frequency IS NULL AND date >= ${startOfDay} AND date <= ${endOfDay})
          OR
          -- Recurring steps with current_instance_date or date in range
          (frequency IS NOT NULL AND (
            (current_instance_date >= ${startOfDay} AND current_instance_date <= ${endOfDay})
            OR
            (current_instance_date IS NULL AND date >= ${startOfDay} AND date <= ${endOfDay})
          ))
        )
        ORDER BY 
          CASE WHEN completed THEN 1 ELSE 0 END,
          is_important DESC,
          is_urgent DESC,
          created_at ASC
      `
    } else if (startDate && endDate) {
      // Get steps for date range (optimized query)
      // PERFORMANCE FIX: Recurring steps now have correct date in database, so we can filter by date range
      // Only include recurring steps that have current_instance_date or date within range
      query = sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
          checklist, COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
          TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
          TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date,
          TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
          TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
          recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
          parent_recurring_step_id,
          TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
        FROM daily_steps 
        WHERE user_id = ${userId}
        AND (
          -- Non-recurring steps with date in range
          (frequency IS NULL AND date >= ${startDate}::date AND date <= ${endDate}::date)
          OR
          -- Recurring steps with current_instance_date or date in range
          (frequency IS NOT NULL AND (
            (current_instance_date >= ${startDate}::date AND current_instance_date <= ${endDate}::date)
            OR
            (current_instance_date IS NULL AND date >= ${startDate}::date AND date <= ${endDate}::date)
          ))
        )
        ORDER BY 
          CASE WHEN completed THEN 1 ELSE 0 END,
          date ASC NULLS LAST,
          is_important DESC,
          is_urgent DESC,
          created_at DESC
      `
    } else {
      // Get all steps for user (fallback - should be avoided for performance)
      query = sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, aspiration_id, area_id,
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
          checklist, COALESCE(require_checklist_complete, false) as require_checklist_complete,
          frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
          TO_CHAR(last_instance_date, 'YYYY-MM-DD') as last_instance_date,
          TO_CHAR(last_completed_instance_date, 'YYYY-MM-DD') as last_completed_instance_date,
          TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
          TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
          recurring_display_mode, COALESCE(is_hidden, false) as is_hidden,
          parent_recurring_step_id,
          TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
        FROM daily_steps 
        WHERE user_id = ${userId}
        ORDER BY 
          CASE WHEN completed THEN 1 ELSE 0 END,
          date ASC NULLS LAST,
          is_important DESC,
          is_urgent DESC,
          created_at DESC
      `
    }
    
    const queryStartTime = performance.now()
    const steps = await query
    const queryTime = performance.now() - queryStartTime
    
    if (steps.length > 0) {
      console.log(`[Performance DB] SQL query returned ${steps.length} steps in ${queryTime.toFixed(2)}ms`)
    }
    
    // Decrypt all steps (title, description, and checklist)
    // PERFORMANCE: This can be slow for large datasets (decryption is CPU-intensive)
    const decryptStartTime = performance.now()
    const decryptedSteps = steps.map((step, index) => {
      const decrypted = decryptFields(step, userId, ['title', 'description'])
      // Decrypt checklist items
      if (step.checklist) {
        decrypted.checklist = decryptChecklist(step.checklist, userId)
      }
      return decrypted
    }) as DailyStep[]
    const decryptTime = performance.now() - decryptStartTime
    
    if (decryptedSteps.length > 0) {
      const avgTimePerStep = (decryptTime / decryptedSteps.length).toFixed(2)
      console.log(`[Performance DB] Decrypted ${decryptedSteps.length} steps in ${decryptTime.toFixed(2)}ms (avg ${avgTimePerStep}ms per step)`)
      console.log(`[Performance DB] Total: SQL ${queryTime.toFixed(2)}ms + Decrypt ${decryptTime.toFixed(2)}ms = ${(queryTime + decryptTime).toFixed(2)}ms`)
    }
    
    // Clear encryption key cache after request to free memory
    clearEncryptionKeyCache()
    
    return decryptedSteps
  } catch (error) {
    console.error('Error fetching daily steps:', error)
    return []
  }
}


export async function getInspirationValues(): Promise<Value[]> {
  try {
    const values = await sql`
      SELECT * FROM values 
      WHERE is_custom = false
      ORDER BY name
    `
    return values as Value[]
  } catch (error) {
    console.error('Error fetching inspiration values:', error)
    return []
  }
}

export async function createGoal(goalData: Partial<Goal>): Promise<Goal> {
  const id = crypto.randomUUID()
  
  // Set start_date to today if goal is active and start_date is not provided
  // But only if start_date is not explicitly provided in goalData
  let status = goalData.status || 'active'
  let startDate: string | null = null
  
  if (goalData.start_date !== undefined && goalData.start_date !== null) {
    // start_date was explicitly provided - normalize it to YYYY-MM-DD string
    if (typeof goalData.start_date === 'string' && goalData.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Already YYYY-MM-DD format
      startDate = goalData.start_date
    } else if (typeof goalData.start_date === 'string' && goalData.start_date.includes('T')) {
      // ISO string - extract date part
      startDate = goalData.start_date.split('T')[0]
    } else {
      // Date object or other format
      const dateObj = goalData.start_date instanceof Date 
        ? goalData.start_date 
        : new Date(goalData.start_date)
      if (!isNaN(dateObj.getTime())) {
        // Use UTC components to preserve the date
        const year = dateObj.getUTCFullYear()
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getUTCDate()).padStart(2, '0')
        startDate = `${year}-${month}-${day}`
      }
    }
  } else if (status === 'active') {
    // No start_date provided and goal is active - set to today
    const today = new Date()
    const year = today.getUTCFullYear()
    const month = String(today.getUTCMonth() + 1).padStart(2, '0')
    const day = String(today.getUTCDate()).padStart(2, '0')
    startDate = `${year}-${month}-${day}`
  }
  
  // Automatically set status to 'paused' if start_date is in the future
  // Only if status wasn't explicitly set to something else (like 'completed')
  if (startDate && status !== 'completed') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDateObj = new Date(startDate)
    startDateObj.setHours(0, 0, 0, 0)
    
    if (startDateObj > today) {
      status = 'paused'
    } else if (startDateObj <= today && status === 'paused') {
      // If start_date is today or in the past, and status is paused, set to active
      status = 'active'
    }
  }
  
  // Encrypt text fields before inserting
  const encryptedTitle = goalData.title ? encrypt(goalData.title, goalData.user_id!) : null
  const encryptedDescription = goalData.description ? encrypt(goalData.description, goalData.user_id!) : null
  
  const goal = await sql`
    INSERT INTO goals (
      id, user_id, title, description, target_date, start_date, status, priority, 
      category, goal_type, progress_percentage, progress_type, 
      progress_target, progress_current, progress_unit, area_id, aspiration_id
    ) VALUES (
      ${id}, ${goalData.user_id}, ${encryptedTitle}, ${encryptedDescription}, 
      ${goalData.target_date || null}, ${startDate}, ${status}, 
      ${goalData.priority || 'meaningful'}, ${goalData.category || 'medium-term'}, 
      ${goalData.goal_type || 'outcome'}, ${goalData.progress_percentage || 0}, 
      ${goalData.progress_type || 'percentage'}, ${goalData.progress_target || null}, 
      ${goalData.progress_current || 0}, ${goalData.progress_unit || null},
      ${goalData.area_id || null}, ${goalData.aspiration_id || null}
    ) RETURNING *
  `
  
  // Invalidate goals cache for this user
  if (goalData.user_id) {
    invalidateGoalsCache(goalData.user_id)
  }
  
  // Decrypt before returning
  return decryptFields(goal[0], goalData.user_id!, ['title', 'description']) as Goal
}

export async function createDailyStep(stepData: Omit<Partial<DailyStep>, 'date'> & { date?: Date | string, frequency?: string | null, selected_days?: string[] }): Promise<DailyStep> {
  const id = crypto.randomUUID()
  
  // Format date as YYYY-MM-DD string to avoid timezone issues
  // For repeating steps (frequency is set), date should be null
  let dateValue: string | null = null
  if (stepData.frequency) {
    // Repeating step - date should be null
    dateValue = null
  } else if (stepData.date) {
    if (stepData.date instanceof Date) {
      // Use local date components to avoid timezone issues
      const year = stepData.date.getFullYear()
      const month = String(stepData.date.getMonth() + 1).padStart(2, '0')
      const day = String(stepData.date.getDate()).padStart(2, '0')
      dateValue = `${year}-${month}-${day}`
    } else if (typeof stepData.date === 'string') {
      // If it's already a string, use it directly (assuming YYYY-MM-DD format)
      if (stepData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateValue = stepData.date
      } else if (stepData.date.includes('T')) {
        // ISO string with time - extract date part
        dateValue = stepData.date.split('T')[0]
      }
    }
  }
  
  // Encrypt text fields before inserting
  const encryptedTitle = stepData.title ? encrypt(stepData.title, stepData.user_id!) : null
  const encryptedDescription = stepData.description ? encrypt(stepData.description, stepData.user_id!) : null
  
  // Encrypt checklist items
  let encryptedChecklist: any[] | null = null
  if (stepData.checklist && Array.isArray(stepData.checklist)) {
    encryptedChecklist = encryptChecklist(stepData.checklist, stepData.user_id!)
  }
  const checklistJson = encryptedChecklist ? JSON.stringify(encryptedChecklist) : '[]'
  
  const selectedDaysJson = stepData.selected_days ? JSON.stringify(stepData.selected_days) : '[]'
  
  // Format current_instance_date if provided
  let currentInstanceDateValue: string | null = null
  if ((stepData as any).current_instance_date) {
    if (typeof (stepData as any).current_instance_date === 'string') {
      if ((stepData as any).current_instance_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        currentInstanceDateValue = (stepData as any).current_instance_date
      }
    } else if ((stepData as any).current_instance_date instanceof Date) {
      const year = (stepData as any).current_instance_date.getFullYear()
      const month = String((stepData as any).current_instance_date.getMonth() + 1).padStart(2, '0')
      const day = String((stepData as any).current_instance_date.getDate()).padStart(2, '0')
      currentInstanceDateValue = `${year}-${month}-${day}`
    }
  }

  const step = await sql`
    INSERT INTO daily_steps (
      id, user_id, goal_id, title, description, completed, date, 
      is_important, is_urgent, aspiration_id, area_id,
      estimated_time, xp_reward, deadline, checklist, require_checklist_complete,
      frequency, selected_days, recurring_start_date, recurring_end_date, recurring_display_mode, is_hidden,
      current_instance_date
    ) VALUES (
      ${id}, ${stepData.user_id}, ${stepData.goal_id || null}, ${encryptedTitle}, 
      ${encryptedDescription}, ${stepData.completed || false}, 
      ${dateValue}, ${stepData.is_important || false}, 
      ${stepData.is_urgent || false}, ${stepData.aspiration_id || null}, ${stepData.area_id || null}, 
      ${stepData.estimated_time || 30},
      ${stepData.xp_reward || 1}, ${stepData.deadline || null},
      ${checklistJson}::jsonb, ${stepData.require_checklist_complete || false},
      ${stepData.frequency || null}, ${selectedDaysJson}::jsonb,
      ${(stepData as any).recurring_start_date || null}, ${(stepData as any).recurring_end_date || null},
      ${(stepData as any).recurring_display_mode || 'all'}, ${(stepData as any).is_hidden || false},
      ${currentInstanceDateValue}
    ) RETURNING 
      id, user_id, goal_id, title, description, completed, 
      TO_CHAR(date, 'YYYY-MM-DD') as date,
      is_important, is_urgent, aspiration_id, area_id,
      estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
      checklist, require_checklist_complete,
      frequency, selected_days,
      TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
      TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
      recurring_display_mode, is_hidden,
      TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
  `
  
  // Decrypt before returning
  const decrypted = decryptFields(step[0], stepData.user_id!, ['title', 'description'])
  if (step[0].checklist) {
    decrypted.checklist = decryptChecklist(step[0].checklist, stepData.user_id!)
  }
  return decrypted as DailyStep
}

export async function toggleDailyStep(stepId: string): Promise<DailyStep> {
  try {
    // First get the current step
    const currentStep = await sql`
      SELECT * FROM daily_steps WHERE id = ${stepId}
    `
    
    if (currentStep.length === 0) {
      throw new Error('Step not found')
    }

    const step = currentStep[0] as DailyStep
    const newCompleted = !step.completed

    // Update the step
    const updatedStep = await sql`
      UPDATE daily_steps 
      SET completed = ${newCompleted}, 
          completed_at = ${newCompleted ? new Date().toISOString() : null},
          updated_at = NOW()
      WHERE id = ${stepId}
      RETURNING *
    `

    // Update goal progress if step was completed
    if (newCompleted && step.goal_id) {
      await updateGoalProgressCombined(step.goal_id)
    }

    // Decrypt before returning
    const userId = step.user_id
    const decrypted = decryptFields(updatedStep[0], userId, ['title', 'description'])
    if (updatedStep[0].checklist) {
      decrypted.checklist = decryptChecklist(updatedStep[0].checklist, userId)
    }
    return decrypted as DailyStep
  } catch (error) {
    console.error('Error toggling daily step:', error)
    throw error
  }
}

export async function completeDailyStep(stepId: string): Promise<DailyStep> {
  try {
    const updatedStep = await sql`
      UPDATE daily_steps 
      SET completed = true, completed_at = ${new Date().toISOString()}, updated_at = NOW()
      WHERE id = ${stepId}
      RETURNING *
    `
    
    if (updatedStep.length === 0) {
      throw new Error('Step not found')
    }

    const step = updatedStep[0] as DailyStep
    
    // Update goal progress if step was completed
    if (step.goal_id) {
      await updateGoalProgressCombined(step.goal_id)
    }
    
    // Decrypt before returning
    const userId = step.user_id
    const decrypted = decryptFields(step, userId, ['title', 'description'])
    if (step.checklist) {
      decrypted.checklist = decryptChecklist(step.checklist, userId) || undefined
    }
    return decrypted as DailyStep
  } catch (error) {
    console.error('Error completing daily step:', error)
    throw error
  }
}

export async function updateDailyStep(stepId: string, stepData: Partial<DailyStep>): Promise<DailyStep> {
  try {
    const updatedStep = await sql`
      UPDATE daily_steps 
      SET completed = ${stepData.completed || false},
          completed_at = ${stepData.completed_at ? stepData.completed_at.toISOString() : null},
          updated_at = NOW()
      WHERE id = ${stepId}
      RETURNING *
    `
    
    if (updatedStep.length === 0) {
      throw new Error('Step not found')
    }
    
    // Decrypt before returning
    const userId = updatedStep[0].user_id
    const decrypted = decryptFields(updatedStep[0], userId, ['title', 'description'])
    if (updatedStep[0].checklist) {
      decrypted.checklist = decryptChecklist(updatedStep[0].checklist, userId)
    }
    return decrypted as DailyStep
  } catch (error) {
    console.error('Error updating daily step:', error)
    throw error
  }
}

export async function updateDailyStepFields(stepId: string, updates: Partial<DailyStep>): Promise<DailyStep | null> {
  try {
    // First get the current step to get user_id
    const currentStep = await sql`
      SELECT user_id FROM daily_steps WHERE id = ${stepId}
    `
    
    if (currentStep.length === 0) {
      return null
    }
    
    const userId = currentStep[0].user_id
    
    // Build dynamic update query
    const setParts: string[] = []
    const values: any[] = []
    
    if (updates.title !== undefined) {
      // Encrypt title before updating
      const encryptedTitle = updates.title ? encrypt(updates.title, userId) : null
      setParts.push(`title = $${values.length + 1}`)
      values.push(encryptedTitle)
    }
    if (updates.description !== undefined) {
      // Encrypt description before updating
      const encryptedDescription = updates.description ? encrypt(updates.description, userId) : null
      setParts.push(`description = $${values.length + 1}`)
      values.push(encryptedDescription)
    }
    if (updates.completed !== undefined) {
      setParts.push(`completed = $${values.length + 1}`)
      values.push(updates.completed)
      if (updates.completed) {
        setParts.push(`completed_at = $${values.length + 1}`)
        values.push(new Date().toISOString())
      } else {
        setParts.push(`completed_at = NULL`)
      }
    }
    if (updates.date !== undefined) {
      let dateValue: string | null = null
      const date = updates.date
      if (date) {
        if (date instanceof Date) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          dateValue = `${year}-${month}-${day}`
        } else {
          // TypeScript knows date is string here
          const dateStr = date as string
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateValue = dateStr
          } else if (dateStr.includes('T')) {
            dateValue = dateStr.split('T')[0]
          }
        }
      }
      setParts.push(`date = $${values.length + 1}`)
      values.push(dateValue)
    }
    // Mutual exclusivity for goal_id and area_id
    // Check if values are actually provided (not just undefined)
    const hasGoalIdValue = updates.goal_id !== undefined && updates.goal_id !== null
    const hasAreaIdValue = updates.area_id !== undefined && updates.area_id !== null
    
    console.log('🔧 updateDailyStepFields - processing goal_id and area_id:', {
      goal_id: updates.goal_id,
      area_id: updates.area_id,
      hasGoalIdValue,
      hasAreaIdValue
    })
    
    if (hasGoalIdValue) {
      // goal_id has a value - use it and clear area_id
      console.log('✅ Setting goal_id, clearing area_id')
      setParts.push(`goal_id = $${values.length + 1}`)
      values.push(updates.goal_id)
      setParts.push('area_id = NULL') // Clear area_id if goal_id is set
    } else if (updates.goal_id !== undefined) {
      // goal_id was explicitly set to null - clear it, but don't touch area_id unless it's also provided
      console.log('⚠️ goal_id is null, clearing it')
      setParts.push('goal_id = NULL')
      if (hasAreaIdValue) {
        console.log('✅ Also setting area_id since goal_id is null')
        setParts.push(`area_id = $${values.length + 1}`)
        values.push(updates.area_id)
      }
    } else if (hasAreaIdValue) {
      // area_id has a value - use it and clear goal_id
      console.log('✅ Setting area_id, clearing goal_id')
      setParts.push(`area_id = $${values.length + 1}`)
      values.push(updates.area_id)
      setParts.push('goal_id = NULL') // Clear goal_id if area_id is set
    } else if (updates.area_id !== undefined) {
      // area_id was explicitly set to null - clear it
      console.log('⚠️ area_id is null, clearing it')
      setParts.push('area_id = NULL')
    }
    if (updates.aspiration_id !== undefined) {
      setParts.push(`aspiration_id = $${values.length + 1}`)
      values.push(updates.aspiration_id)
    }
    if (updates.is_important !== undefined) {
      setParts.push(`is_important = $${values.length + 1}`)
      values.push(updates.is_important)
    }
    if (updates.is_urgent !== undefined) {
      setParts.push(`is_urgent = $${values.length + 1}`)
      values.push(updates.is_urgent)
    }
    if (updates.estimated_time !== undefined) {
      setParts.push(`estimated_time = $${values.length + 1}`)
      values.push(updates.estimated_time)
    }
    if (updates.xp_reward !== undefined) {
      setParts.push(`xp_reward = $${values.length + 1}`)
      values.push(updates.xp_reward)
    }
    if (updates.checklist !== undefined) {
      // Encrypt checklist items before updating
      let encryptedChecklist: any[] | null = null
      if (updates.checklist && Array.isArray(updates.checklist)) {
        encryptedChecklist = encryptChecklist(updates.checklist, userId)
      }
      setParts.push(`checklist = $${values.length + 1}::jsonb`)
      values.push(encryptedChecklist ? JSON.stringify(encryptedChecklist) : '[]')
    }
    if (updates.require_checklist_complete !== undefined) {
      setParts.push(`require_checklist_complete = $${values.length + 1}`)
      values.push(updates.require_checklist_complete)
    }
    if (updates.frequency !== undefined) {
      setParts.push(`frequency = $${values.length + 1}`)
      values.push(updates.frequency)
    }
    if (updates.selected_days !== undefined) {
      setParts.push(`selected_days = $${values.length + 1}::jsonb`)
      values.push(JSON.stringify(updates.selected_days))
    }
    if ((updates as any).recurring_start_date !== undefined) {
      const recurringStartDate = (updates as any).recurring_start_date
      if (recurringStartDate === null || recurringStartDate === '') {
        setParts.push('recurring_start_date = NULL')
      } else {
        setParts.push(`recurring_start_date = $${values.length + 1}`)
        values.push(recurringStartDate)
      }
    }
    if ((updates as any).recurring_end_date !== undefined) {
      const recurringEndDate = (updates as any).recurring_end_date
      if (recurringEndDate === null || recurringEndDate === '') {
        setParts.push('recurring_end_date = NULL')
      } else {
        setParts.push(`recurring_end_date = $${values.length + 1}`)
        values.push(recurringEndDate)
      }
    }
    if ((updates as any).current_instance_date !== undefined) {
      const currentInstanceDate = (updates as any).current_instance_date
      if (currentInstanceDate === null || currentInstanceDate === '') {
        setParts.push('current_instance_date = NULL')
      } else {
        setParts.push(`current_instance_date = $${values.length + 1}`)
        values.push(currentInstanceDate)
      }
    }
    
    // Always update updated_at
    setParts.push('updated_at = NOW()')
    
    if (setParts.length === 1) {
      // Only updated_at, no actual updates
      // Still fetch and return the step
    } else {
      const query = `UPDATE daily_steps SET ${setParts.join(', ')} WHERE id = $${values.length + 1} RETURNING id, user_id, goal_id, title, description, completed, TO_CHAR(date, 'YYYY-MM-DD') as date, is_important, is_urgent, aspiration_id, area_id, estimated_time, xp_reward, deadline, completed_at, created_at, updated_at, COALESCE(checklist, '[]'::jsonb) as checklist, COALESCE(require_checklist_complete, false) as require_checklist_complete, frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days, TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date, TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date, TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date`
      values.push(stepId)
      
      const result = await sql.query(query, values)
      const rows = result as any[]
      if (rows.length === 0) {
        return null
      }
      
      // Update goal progress if step was completed
      if (updates.completed && rows[0].goal_id) {
        await updateGoalProgressCombined(rows[0].goal_id)
      }
      
      // Decrypt before returning
      const decrypted = decryptFields(rows[0], userId, ['title', 'description'])
      if (rows[0].checklist) {
        decrypted.checklist = decryptChecklist(rows[0].checklist, userId)
      }
      return decrypted as DailyStep
    }
    
    // Fetch the step if no updates were made
    const step = await sql`
      SELECT id, user_id, goal_id, title, description, completed, 
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        is_important, is_urgent, aspiration_id, area_id,
        estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
        COALESCE(checklist, '[]'::jsonb) as checklist,
        COALESCE(require_checklist_complete, false) as require_checklist_complete,
        frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days,
        TO_CHAR(recurring_start_date, 'YYYY-MM-DD') as recurring_start_date,
        TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as recurring_end_date,
        TO_CHAR(current_instance_date, 'YYYY-MM-DD') as current_instance_date
      FROM daily_steps
      WHERE id = ${stepId}
    `
    
    if (step.length === 0) {
      return null
    }
    
    // Decrypt before returning
    const decrypted = decryptFields(step[0], userId, ['title', 'description'])
    if (step[0].checklist) {
      decrypted.checklist = decryptChecklist(step[0].checklist, userId)
    }
    return decrypted as DailyStep
  } catch (error) {
    console.error('Error updating daily step fields:', error)
    return null
  }
}

export async function updateDailyStepGeneral(stepId: string, stepData: Omit<Partial<DailyStep>, 'date'> & { date?: Date | string }): Promise<DailyStep> {
  try {
    // Update each field individually using template literals
    if (stepData.title !== undefined) {
      await sql`UPDATE daily_steps SET title = ${stepData.title}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.description !== undefined) {
      await sql`UPDATE daily_steps SET description = ${stepData.description}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.date !== undefined) {
      // Format date as YYYY-MM-DD string to avoid timezone issues
      let dateValue: string | null = null
      if (stepData.date) {
        if (stepData.date instanceof Date) {
          // Use local date components to avoid timezone issues
          const year = stepData.date.getFullYear()
          const month = String(stepData.date.getMonth() + 1).padStart(2, '0')
          const day = String(stepData.date.getDate()).padStart(2, '0')
          dateValue = `${year}-${month}-${day}`
        } else if (typeof stepData.date === 'string') {
          // If it's already a string, use it directly (assuming YYYY-MM-DD format)
          if (stepData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateValue = stepData.date
          } else if (stepData.date.includes('T')) {
            // ISO string with time - extract date part and parse as local
            const datePart = stepData.date.split('T')[0]
            const [year, month, day] = datePart.split('-').map(Number)
            const localDate = new Date(year, month - 1, day)
            dateValue = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`
          }
        }
      }
      await sql`UPDATE daily_steps SET date = ${dateValue}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.goal_id !== undefined) {
      await sql`UPDATE daily_steps SET goal_id = ${stepData.goal_id}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.is_important !== undefined) {
      await sql`UPDATE daily_steps SET is_important = ${stepData.is_important}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.is_urgent !== undefined) {
      await sql`UPDATE daily_steps SET is_urgent = ${stepData.is_urgent}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.aspiration_id !== undefined) {
      await sql`UPDATE daily_steps SET aspiration_id = ${stepData.aspiration_id}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.deadline !== undefined) {
      const deadlineValue = stepData.deadline instanceof Date ? stepData.deadline.toISOString() : stepData.deadline
      await sql`UPDATE daily_steps SET deadline = ${deadlineValue}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.completed !== undefined) {
      await sql`UPDATE daily_steps SET completed = ${stepData.completed}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.completed_at !== undefined) {
      const completedAtValue = stepData.completed_at instanceof Date ? stepData.completed_at.toISOString() : stepData.completed_at
      await sql`UPDATE daily_steps SET completed_at = ${completedAtValue}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.frequency !== undefined) {
      await sql`UPDATE daily_steps SET frequency = ${stepData.frequency}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.selected_days !== undefined) {
      const selectedDaysJson = JSON.stringify(stepData.selected_days)
      await sql`UPDATE daily_steps SET selected_days = ${selectedDaysJson}::jsonb, updated_at = NOW() WHERE id = ${stepId}`
    }
    
    // Get the updated step
    const updatedStep = await sql`
      SELECT id, user_id, goal_id, title, description, completed, 
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        is_important, is_urgent, aspiration_id, area_id,
        estimated_time, xp_reward, deadline, completed_at, created_at, updated_at,
        COALESCE(checklist, '[]'::jsonb) as checklist,
        COALESCE(require_checklist_complete, false) as require_checklist_complete,
        frequency, COALESCE(selected_days, '[]'::jsonb) as selected_days
      FROM daily_steps WHERE id = ${stepId}
    `
    
    if (updatedStep.length === 0) {
      throw new Error('Step not found')
    }
    
    return updatedStep[0] as DailyStep
  } catch (error) {
    console.error('Error updating daily step:', error)
    throw error
  }
}

export async function deleteDailyStep(stepId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM daily_steps WHERE id = ${stepId}
    `
  } catch (error) {
    console.error('Error deleting daily step:', error)
    throw error
  }
}

export async function updateDailyStepValue(stepId: string, value: number): Promise<DailyStep> {
  try {
    const updatedStep = await sql`
      UPDATE daily_steps 
      SET update_value = ${value}, updated_at = NOW()
      WHERE id = ${stepId}
      RETURNING *
    `
    
    if (updatedStep.length === 0) {
      throw new Error('Step not found')
    }
    
    return updatedStep[0] as DailyStep
  } catch (error) {
    console.error('Error updating daily step value:', error)
    throw error
  }
}


export async function updateDailyStepDate(stepId: string, newDate: Date): Promise<DailyStep> {
  try {
    const updatedStep = await sql`
      UPDATE daily_steps 
      SET date = ${newDate.toISOString().split('T')[0]}, updated_at = NOW()
      WHERE id = ${stepId}
      RETURNING *
    `
    return updatedStep[0] as DailyStep
  } catch (error) {
    console.error('Error updating daily step date:', error)
    throw error
  }
}

export async function getGoalById(goalId: string): Promise<Goal | null> {
  try {
    const goal = await sql`
      SELECT * FROM goals WHERE id = ${goalId}
    `
    if (!goal[0]) {
      return null
    }
    
    // Decrypt goal before returning
    const userId = goal[0].user_id
    return decryptFields(goal[0], userId, ['title', 'description']) as Goal
  } catch (error) {
    console.error('Error fetching goal:', error)
    return null
  }
}

export async function getUpdatedGoalAfterStepCompletion(goalId: string): Promise<Goal> {
  try {
    const goal = await sql`
      SELECT * FROM goals WHERE id = ${goalId}
    `
    if (!goal || goal.length === 0) {
      throw new Error('Goal not found')
    }
    
    // Decrypt before returning
    const userId = goal[0].user_id
    return decryptFields(goal[0], userId, ['title', 'description']) as Goal
  } catch (error) {
    console.error('Error fetching updated goal:', error)
    throw error
  }
}

export async function updateGoal(goalId: string, userId: string, goalData: Partial<Goal>): Promise<Goal> {
  try {
    console.log('DB: updateGoal called with:', { goalId, userId, goalData })
    
    // Ensure optional columns exist for forward compatibility
    try {
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS area_id VARCHAR(255)`
    } catch (e) {
      console.warn('DB: Failed to ensure area_id column exists (may already exist):', e)
    }
    // Build dynamic update query to only update provided fields
    const setParts: string[] = []
    const values: any[] = []

    if (goalData.title !== undefined) {
      setParts.push(`title = $${setParts.length + 1}`)
      values.push(goalData.title)
    }
    if (goalData.description !== undefined) {
      setParts.push(`description = $${setParts.length + 1}`)
      values.push(goalData.description)
    }
    if (goalData.target_date !== undefined) {
      setParts.push(`target_date = $${setParts.length + 1}`)
      values.push(goalData.target_date)
    }
    if (goalData.priority !== undefined) {
      setParts.push(`priority = $${setParts.length + 1}`)
      values.push(goalData.priority)
    }
    if (goalData.category !== undefined) {
      setParts.push(`category = $${setParts.length + 1}`)
      values.push(goalData.category)
    }
    if (goalData.progress_type !== undefined) {
      setParts.push(`progress_type = $${setParts.length + 1}`)
      values.push(goalData.progress_type)
    }
    if (goalData.progress_target !== undefined) {
      setParts.push(`progress_target = $${setParts.length + 1}`)
      values.push(goalData.progress_target)
    }
    if (goalData.progress_current !== undefined) {
      setParts.push(`progress_current = $${setParts.length + 1}`)
      values.push(goalData.progress_current)
    }
    if (goalData.progress_unit !== undefined) {
      setParts.push(`progress_unit = $${setParts.length + 1}`)
      values.push(goalData.progress_unit)
    }
    if (goalData.area_id !== undefined && goalData.area_id !== null) {
      setParts.push(`area_id = $${setParts.length + 1}`)
      values.push(goalData.area_id)
      console.log('DB: Adding area_id to update:', goalData.area_id)
    } else if (goalData.area_id === null) {
      setParts.push('area_id = NULL')
      console.log('DB: Setting area_id to NULL')
    } else {
      console.log('DB: area_id not provided or undefined:', goalData.area_id)
    }
    if (goalData.status !== undefined) {
      setParts.push(`status = $${setParts.length + 1}`)
      values.push(goalData.status)
      console.log('DB: Adding status to update:', goalData.status)
    }
    if (goalData.icon !== undefined) {
      setParts.push(`icon = $${setParts.length + 1}`)
      values.push(goalData.icon)
      console.log('DB: Adding icon to update:', goalData.icon)
    }

    // Always update the updated_at field
    setParts.push('updated_at = NOW()')

    if (setParts.length === 1) { // Only updated_at
      throw new Error('No fields to update')
    }

    const query = `
      UPDATE goals 
      SET ${setParts.join(', ')}
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `

    const params = [...values, goalId, userId]
    console.log('DB: Executing query:', query)
    console.log('DB: With values:', params)

    const updated = await sql.query(query, params)
    const row = (updated as any[])[0]
    console.log('DB: Updated goal result:', row)

    if (!row) {
      throw new Error('Goal not found or access denied')
    }

    // Invalidate goals cache for this user
    invalidateGoalsCache(userId)

    // Decrypt before returning
    return decryptFields(row, userId, ['title', 'description']) as Goal
  } catch (error) {
    console.error('Error updating goal:', error)
    throw error
  }
}

export async function updateGoalById(goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
  try {
    console.log('Updating goal with ID:', goalId, 'Updates:', updates)
    
    // Ensure focus columns exist
    try {
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS focus_status VARCHAR(20) DEFAULT NULL`
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS focus_order INTEGER DEFAULT NULL`
    } catch (e) {
      // Columns might already exist, ignore
      console.log('Note: Focus columns may already exist')
    }
    
    // Ensure start_date column exists
    try {
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL`
    } catch (e) {
      console.log('Note: start_date column may already exist')
    }
    
    // Ensure start_date column exists
    try {
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL`
    } catch (e) {
      console.log('Note: start_date column may already exist')
    }
    
    // Get userId first (needed for encryption)
    const existingGoal = await sql`SELECT user_id FROM goals WHERE id = ${goalId}`
    if (!existingGoal || existingGoal.length === 0) {
      return null
    }
    const userId = existingGoal[0].user_id
    
    // Build dynamic update query to only update provided fields
    const setParts: string[] = []
    const values: any[] = []
    
    // Encrypt text fields that are being updated
    if (updates.title !== undefined) {
      setParts.push(`title = $${values.length + 1}`)
      values.push(updates.title ? encrypt(updates.title, userId) : null)
    }
    if (updates.description !== undefined) {
      setParts.push(`description = $${values.length + 1}`)
      values.push(updates.description ? encrypt(updates.description, userId) : null)
    }
    if (updates.area_id !== undefined) {
      if (updates.area_id === null) {
        setParts.push('area_id = NULL')
      } else {
      setParts.push(`area_id = $${values.length + 1}`)
      values.push(updates.area_id)
      }
    }
    if (updates.aspiration_id !== undefined) {
      if (updates.aspiration_id === null) {
        setParts.push('aspiration_id = NULL')
      } else {
      setParts.push(`aspiration_id = $${values.length + 1}`)
      values.push(updates.aspiration_id)
      }
    }
    if (updates.target_date !== undefined) {
      if (updates.target_date === null) {
        setParts.push('target_date = NULL')
      } else {
      setParts.push(`target_date = $${values.length + 1}`)
      values.push(updates.target_date)
      }
    }
    if (updates.status !== undefined) {
      setParts.push(`status = $${values.length + 1}`)
      values.push(updates.status)
      
      // If status is being set to 'active' and start_date is not set, set it to today
      if (updates.status === 'active') {
        // Check if start_date is already set - if not, set it to today
        const currentGoal = await sql`SELECT start_date FROM goals WHERE id = ${goalId}`
        if (Array.isArray(currentGoal) && currentGoal.length > 0 && !currentGoal[0].start_date) {
          setParts.push(`start_date = CURRENT_DATE`)
        }
      }
    }
    if (updates.start_date !== undefined) {
      if (updates.start_date === null) {
        setParts.push('start_date = NULL')
      } else {
        // start_date should already be a YYYY-MM-DD string from the API
        // If it's a Date object, convert to YYYY-MM-DD using UTC to avoid timezone issues
        let dateString: string
        if (typeof updates.start_date === 'string' && updates.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Already in YYYY-MM-DD format, use directly
          dateString = updates.start_date
        } else if (updates.start_date instanceof Date) {
          // Date object - use UTC components to preserve the date
          const year = updates.start_date.getUTCFullYear()
          const month = String(updates.start_date.getUTCMonth() + 1).padStart(2, '0')
          const day = String(updates.start_date.getUTCDate()).padStart(2, '0')
          dateString = `${year}-${month}-${day}`
        } else {
          // Try to parse as string and extract date part
          const dateValue = new Date(updates.start_date)
          if (!isNaN(dateValue.getTime())) {
            // If it's an ISO string with timezone, use UTC components
            if (typeof updates.start_date === 'string' && updates.start_date.includes('T') && updates.start_date.includes('Z')) {
              const year = dateValue.getUTCFullYear()
              const month = String(dateValue.getUTCMonth() + 1).padStart(2, '0')
              const day = String(dateValue.getUTCDate()).padStart(2, '0')
              dateString = `${year}-${month}-${day}`
            } else {
              // Extract date part from ISO string or use local date
              dateString = dateValue.toISOString().split('T')[0]
            }
          } else {
            throw new Error(`Invalid start_date format: ${updates.start_date}`)
          }
        }
        
        // Automatically update status based on start_date if status is not explicitly being changed
        if (updates.status === undefined) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const startDateObj = new Date(dateString)
          startDateObj.setHours(0, 0, 0, 0)
          
          // Get current goal status to check if it's completed
          const currentGoal = await sql`SELECT status FROM goals WHERE id = ${goalId}`
          const currentStatus = Array.isArray(currentGoal) && currentGoal.length > 0 ? currentGoal[0].status : null
          
          // Only auto-update if goal is not completed
          if (currentStatus !== 'completed') {
            if (startDateObj > today) {
              // Start date is in the future - set to paused
              setParts.push(`status = $${values.length + 1}`)
              values.push('paused')
            } else if (startDateObj <= today && currentStatus === 'paused') {
              // Start date is today or in the past, and goal is paused - set to active
              setParts.push(`status = $${values.length + 1}`)
              values.push('active')
            }
          }
        }
        
        setParts.push(`start_date = $${values.length + 1}`)
        values.push(dateString)
      }
    }
    if (updates.icon !== undefined) {
      if (updates.icon === null) {
        setParts.push('icon = NULL')
      } else {
        setParts.push(`icon = $${values.length + 1}`)
        values.push(updates.icon)
      }
    }
    if (updates.focus_status !== undefined) {
      if (updates.focus_status === null) {
        setParts.push('focus_status = NULL')
      } else {
        setParts.push(`focus_status = $${values.length + 1}`)
        values.push(updates.focus_status)
      }
    }
    if (updates.focus_order !== undefined) {
      if (updates.focus_order === null) {
        setParts.push('focus_order = NULL')
      } else {
        setParts.push(`focus_order = $${values.length + 1}`)
        values.push(updates.focus_order)
      }
    }
    
    // Always update updated_at
    setParts.push('updated_at = NOW()')
    
    if (setParts.length === 1) {
      // Only updated_at, no actual updates
      console.log('No fields to update')
      // Still fetch and return the goal
    } else {
      const query = `UPDATE goals SET ${setParts.join(', ')} WHERE id = $${values.length + 1} RETURNING *`
      values.push(goalId)
      
      console.log('Executing query:', query)
      console.log('With values:', values)
      
      const result = await sql.query(query, values)
      console.log('Update result:', result)
      
      const rows = result as any[]
      if (rows.length === 0) {
        console.log('No goal found for ID:', goalId)
        return null
      }
    }
    
    // Get the updated goal with area name
    const goalWithArea = await sql`
      SELECT g.*, a.name as area_name
      FROM goals g
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.id = ${goalId}
    `
    
    if (!goalWithArea || goalWithArea.length === 0) {
      return null
    }
    
    // Invalidate goals cache for this user
    if (userId) {
      invalidateGoalsCache(userId)
    }
    
    // Decrypt before returning
    return decryptFields(goalWithArea[0], userId, ['title', 'description']) as Goal
  } catch (error) {
    console.error('Error updating goal:', error)
    throw error
  }
}

export async function deleteGoalById(goalId: string, deleteSteps: boolean = false): Promise<boolean> {
  try {
    console.log('Deleting goal with ID:', goalId, 'deleteSteps:', deleteSteps)
    
    // Get userId before deleting
    const goal = await sql`
      SELECT user_id FROM goals WHERE id = ${goalId}
    `
    
    if (goal.length === 0) {
      return false
    }
    
    const userId = goal[0].user_id
    
    // Handle steps based on deleteSteps parameter
    if (deleteSteps) {
      // Delete all steps related to this goal
      const steps = await sql`
        SELECT id FROM daily_steps 
        WHERE goal_id = ${goalId} AND user_id = ${userId}
      `
      
      const stepIds = steps.map(step => step.id)
      
      if (stepIds.length > 0) {
        // Delete related automations, metrics, etc. (similar to deleteGoal function)
        const automations = await sql`
          SELECT id FROM automations 
          WHERE target_id = ANY(${stepIds})
        `
        const automationIds = automations.map(automation => automation.id)
        
        if (automationIds.length > 0) {
          await sql`
            DELETE FROM event_interactions 
            WHERE automation_id = ANY(${automationIds})
          `
        }
        
        await sql`
          DELETE FROM automations 
          WHERE target_id = ANY(${stepIds})
        `
        
        // Delete the steps
        await sql`
          DELETE FROM daily_steps 
          WHERE goal_id = ${goalId} AND user_id = ${userId}
        `
      }
    } else {
      // Just disconnect steps from the goal (set goal_id to null)
      await sql`
        UPDATE daily_steps 
        SET goal_id = NULL 
        WHERE goal_id = ${goalId} AND user_id = ${userId}
      `
    }
    
    // Delete events related to this goal (if goal_id column exists)
    // Note: Events may be automatically deleted via CASCADE if foreign key is set up
    try {
      await sql`
        DELETE FROM events 
        WHERE goal_id = ${goalId} AND user_id = ${userId}
      `
    } catch (error: any) {
      // If goal_id column doesn't exist, try to delete via automation_id
      // First get all automation IDs for this goal's steps
      if (error?.code === '42703' || error?.message?.includes('does not exist')) {
        console.log('Events table does not have goal_id column, skipping event deletion')
        // Events will be cleaned up via CASCADE or can be left as orphaned records
      } else {
        throw error
      }
    }
    
    // Delete the goal
    const result = await sql`
      DELETE FROM goals 
      WHERE id = ${goalId}
      RETURNING id
    `

    console.log('Delete result:', result)
    
    // Invalidate goals cache for this user
    if (userId) {
      invalidateGoalsCache(userId)
    }
    
    return result.length > 0
  } catch (error) {
    console.error('Error deleting goal:', error)
    throw error
  }
}



export async function updateUserPreferredLocale(userId: string, locale: string | null): Promise<User> {
  try {
    // Ensure the column exists (for existing databases)
    try {
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10)
      `
    } catch (alterError) {
      // Column might already exist, ignore error
      console.log('Column preferred_locale check:', alterError instanceof Error ? alterError.message : 'Unknown')
    }
    
    const result = await sql`
      UPDATE users 
      SET preferred_locale = ${locale}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `
    
    if (result.length === 0) {
      throw new Error('User not found')
    }
    
    const updatedUser = result[0] as User
    
    // Invalidate cache
    await invalidateUserCacheByUserId(userId)
    
    return updatedUser
  } catch (error) {
    console.error('Error updating user preferred locale:', error)
    throw error
  }
}

export async function updateUserOnboardingStatus(userId: string, hasCompletedOnboarding: boolean): Promise<void> {
  try {
    const result = await sql`
      UPDATE users 
      SET 
        has_completed_onboarding = ${hasCompletedOnboarding}, 
        updated_at = NOW()
      WHERE id = ${userId}
    `
    
    // Invalidate cache for this user
    await invalidateUserCacheByUserId(userId)
  } catch (error) {
    console.error('Error updating user onboarding status:', error)
    throw error
  }
}

// Goal Metrics functions
export async function createGoalMetric(metricData: Omit<GoalMetric, 'id' | 'created_at' | 'updated_at'>): Promise<GoalMetric> {
  try {
    console.log('createGoalMetric called with:', {
      user_id: metricData.user_id,
      goal_id: metricData.goal_id,
      name: metricData.name,
      type: metricData.type,
      unit: metricData.unit,
      target_value: metricData.target_value,
      current_value: metricData.current_value,
      incremental_value: metricData.incremental_value
    })
    
    // Check if table exists, if not create it
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'goal_metrics'
        )
      `
      
      if (!tableCheck[0]?.exists) {
        console.log('goal_metrics table does not exist, creating it...')
        await sql`
          CREATE TABLE goal_metrics (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'currency', 'percentage', 'distance', 'time', 'weight', 'custom')),
            unit TEXT,
            target_value DECIMAL(10,2) NOT NULL,
            current_value DECIMAL(10,2) DEFAULT 0,
            initial_value DECIMAL(10,2) DEFAULT 0,
            incremental_value DECIMAL(10,2) DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
        console.log('goal_metrics table created successfully')
      } else {
        // Table exists, check if incremental_value column exists
        try {
          const columnCheck = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'goal_metrics' AND column_name = 'incremental_value'
          `
          
          if (columnCheck.length === 0) {
            console.log('Adding incremental_value column to goal_metrics table...')
            await sql`ALTER TABLE goal_metrics ADD COLUMN incremental_value DECIMAL(10,2) DEFAULT 1`
            console.log('incremental_value column added successfully')
          } else {
            console.log('incremental_value column already exists')
          }
        } catch (migrationError: any) {
          console.warn('Could not check/add incremental_value column:', migrationError?.message)
          // Continue anyway, will try without the column
        }
        
        // Check if initial_value column exists
        try {
          const columnCheck = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'goal_metrics' AND column_name = 'initial_value'
          `
          
          if (columnCheck.length === 0) {
            console.log('Adding initial_value column to goal_metrics table...')
            await sql`ALTER TABLE goal_metrics ADD COLUMN initial_value DECIMAL(10,2) DEFAULT 0`
            console.log('initial_value column added successfully')
          } else {
            console.log('initial_value column already exists')
          }
        } catch (migrationError: any) {
          console.warn('Could not check/add initial_value column:', migrationError?.message)
          // Continue anyway, will try without the column
        }
      }
    } catch (tableError: any) {
      console.error('Error checking/creating goal_metrics table:', tableError)
      throw tableError
    }
    
    const id = crypto.randomUUID()
    console.log('Generated metric ID:', id)
    
    // Encrypt name, description, and unit before inserting
    const encryptedName = metricData.name ? encrypt(metricData.name, metricData.user_id) : null
    const encryptedDescription = metricData.description ? encrypt(metricData.description, metricData.user_id) : null
    const encryptedUnit = metricData.unit ? encrypt(metricData.unit, metricData.user_id) : null
    
    // Try with incremental_value first
    try {
      console.log('Attempting INSERT with incremental_value...')
      const metric = await sql`
        INSERT INTO goal_metrics (
          id, user_id, goal_id, name, description, type, unit, target_value, current_value, initial_value, incremental_value
        ) VALUES (
          ${id}, ${metricData.user_id}, ${metricData.goal_id}, ${encryptedName}, 
          ${encryptedDescription}, ${metricData.type}, ${encryptedUnit}, 
          ${metricData.target_value}, ${metricData.current_value}, ${metricData.initial_value ?? 0}, ${metricData.incremental_value || 1}
        ) RETURNING *
      `
      console.log('INSERT successful, metric created:', metric[0])
      // Decrypt before returning
      return decryptFields(metric[0], metricData.user_id, ['name', 'description', 'unit']) as GoalMetric
    } catch (insertError: any) {
      console.error('INSERT with incremental_value failed:', {
        message: insertError?.message,
        code: insertError?.code,
        detail: insertError?.detail
      })
      
      // If insert fails and error mentions incremental_value, try without it
      if (insertError?.message?.includes('incremental_value') || insertError?.code === '42703') {
        console.warn('Insert with incremental_value failed, trying without it:', insertError?.message)
        try {
          const metric = await sql`
            INSERT INTO goal_metrics (
              id, user_id, goal_id, name, description, type, unit, target_value, current_value, initial_value
            ) VALUES (
              ${id}, ${metricData.user_id}, ${metricData.goal_id}, ${encryptedName}, 
              ${encryptedDescription}, ${metricData.type}, ${encryptedUnit}, 
              ${metricData.target_value}, ${metricData.current_value}, ${metricData.initial_value ?? 0}
            ) RETURNING *
          `
          const result = metric[0] as any
          console.log('INSERT without incremental_value successful')
          // Decrypt before returning
          const decrypted = decryptFields(result, metricData.user_id, ['name', 'description', 'unit'])
          return { ...decrypted, incremental_value: metricData.incremental_value || 1, initial_value: metricData.initial_value ?? 0 } as GoalMetric
        } catch (fallbackError: any) {
          console.error('Fallback INSERT also failed:', {
            message: fallbackError?.message,
            code: fallbackError?.code,
            detail: fallbackError?.detail
          })
          throw fallbackError
        }
      }
      throw insertError
    }
  } catch (error: any) {
    console.error('Error creating goal metric:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      stack: error?.stack
    })
    throw error
  }
}

export async function getGoalMetricsByGoalId(goalId: string): Promise<GoalMetric[]> {
  try {
    const metrics = await sql`
      SELECT * FROM goal_metrics 
      WHERE goal_id = ${goalId}
      ORDER BY created_at ASC
    `
    // Decrypt name, description, and unit for each metric
    return metrics.map((metric: any) => 
      decryptFields(metric, metric.user_id, ['name', 'description', 'unit'])
    ) as GoalMetric[]
  } catch (error) {
    console.error('Error fetching goal metrics:', error)
    return []
  }
}

export async function updateGoalMetric(metricId: string, updates: Partial<Omit<GoalMetric, 'id' | 'user_id' | 'goal_id' | 'created_at'>>): Promise<GoalMetric> {
  try {
    // Get user_id first (needed for encryption)
    const existingMetric = await sql`SELECT user_id FROM goal_metrics WHERE id = ${metricId}`
    if (!existingMetric || existingMetric.length === 0) {
      throw new Error('Goal metric not found')
    }
    const userId = existingMetric[0].user_id
    
    // Migrate unit column from VARCHAR(50) to TEXT to support encrypted values
    try {
      await sql`
        ALTER TABLE goal_metrics 
        ALTER COLUMN unit TYPE TEXT
      `
      console.log('Migrated unit column from VARCHAR(50) to TEXT')
    } catch (unitMigrationError: any) {
      // Column might already be TEXT or migration might have failed
      console.warn('Could not migrate unit column (might already be TEXT):', unitMigrationError?.message)
    }
    
    // Check if initial_value column exists, if not add it
    try {
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'goal_metrics' AND column_name = 'initial_value'
      `
      if (columnCheck.length === 0) {
        console.log('Adding initial_value column to goal_metrics table...')
        await sql`ALTER TABLE goal_metrics ADD COLUMN initial_value DECIMAL(10,2) DEFAULT 0`
        console.log('initial_value column added successfully')
      }
    } catch (e: any) {
      console.warn('Could not check/add initial_value column:', e?.message)
      // Continue anyway, will try to update without it if column doesn't exist
    }
    
    // Encrypt name, description, and unit if they are being updated
    const encryptedName = updates.name !== undefined ? (updates.name ? encrypt(updates.name, userId) : null) : undefined
    const encryptedDescription = updates.description !== undefined ? (updates.description ? encrypt(updates.description, userId) : null) : undefined
    const encryptedUnit = updates.unit !== undefined ? (updates.unit ? encrypt(updates.unit, userId) : null) : undefined
    
    // Build UPDATE query - COALESCE will use existing value if new value is NULL
    // We pass NULL for undefined values so COALESCE preserves the existing value
    const metric = await sql`
      UPDATE goal_metrics 
      SET 
        name = ${encryptedName !== undefined ? encryptedName : sql`name`},
        description = ${encryptedDescription !== undefined ? encryptedDescription : sql`description`},
        type = COALESCE(${updates.type ?? null}, type),
        unit = ${encryptedUnit !== undefined ? encryptedUnit : sql`unit`},
        target_value = COALESCE(${updates.target_value ?? null}, target_value),
        current_value = COALESCE(${updates.current_value ?? null}, current_value),
        initial_value = COALESCE(${updates.initial_value ?? null}, initial_value),
        incremental_value = COALESCE(${updates.incremental_value ?? null}, incremental_value),
        updated_at = NOW()
      WHERE id = ${metricId}
      RETURNING *
    `
    // Decrypt before returning
    return decryptFields(metric[0], userId, ['name', 'description', 'unit']) as GoalMetric
  } catch (error) {
    console.error('Error updating goal metric:', error)
    throw error
  }
}

export async function deleteGoalMetric(metricId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM goal_metrics 
      WHERE id = ${metricId}
    `
  } catch (error) {
    console.error('Error deleting goal metric:', error)
    throw error
  }
}


export async function updateGoalProgressFromGoalMetrics(goalId: string) {
  try {
    // Calculate progress based on goal metrics, grouping by compatible units
    // Metrics with the same units are grouped together, progress is calculated per group, then averaged
    const result = await sql`
      WITH metric_progress AS (
        SELECT 
          unit,
          CASE 
            -- If target == initial, check if current >= target (100%) or < target (0%)
            WHEN COALESCE(target_value, 0) = COALESCE(initial_value, 0) THEN
              CASE WHEN current_value >= target_value THEN 100 ELSE 0 END
            -- If range > 0 (going up), progress = (current - initial) / (target - initial) * 100
            WHEN COALESCE(target_value, 0) > COALESCE(initial_value, 0) THEN
              LEAST(GREATEST(((current_value - COALESCE(initial_value, 0)) / (target_value - COALESCE(initial_value, 0))) * 100, 0), 100)
            -- If range < 0 (going down, e.g., 100 to 0), progress = (initial - current) / (initial - target) * 100
            WHEN COALESCE(target_value, 0) < COALESCE(initial_value, 0) THEN
              LEAST(GREATEST(((COALESCE(initial_value, 0) - current_value) / (COALESCE(initial_value, 0) - target_value)) * 100, 0), 100)
            ELSE 0
          END as progress
        FROM goal_metrics
        WHERE goal_id = ${goalId}
      ),
      unit_group_progress AS (
        -- Calculate average progress for each unit group
        SELECT unit, AVG(progress) as group_progress
        FROM metric_progress
        GROUP BY unit
      )
      UPDATE goals 
      SET 
        progress_percentage = COALESCE(
          (SELECT ROUND(AVG(group_progress)) FROM unit_group_progress), 
          0
        ),
        updated_at = NOW()
      WHERE id = ${goalId}
    `

    console.log(`Updated goal ${goalId} progress using goal metrics`)
    return result
  } catch (error) {
    console.error('Error updating goal progress from goal metrics:', error)
    throw error
  }
}

export async function updateGoalProgressCombined(goalId: string) {
  try {
    // Calculate progress as average of all metrics and steps combined
    // Each metric contributes its progress percentage, and steps contribute overall completion percentage
    const result = await sql`
      WITH metric_progress AS (
        SELECT 
          unit,
          CASE 
            -- If target == initial, check if current >= target (100%) or < target (0%)
            WHEN COALESCE(target_value, 0) = COALESCE(initial_value, 0) THEN
              CASE WHEN current_value >= target_value THEN 100 ELSE 0 END
            -- If range > 0 (going up), progress = (current - initial) / (target - initial) * 100
            WHEN COALESCE(target_value, 0) > COALESCE(initial_value, 0) THEN
              LEAST(GREATEST(((current_value - COALESCE(initial_value, 0)) / (target_value - COALESCE(initial_value, 0))) * 100, 0), 100)
            -- If range < 0 (going down, e.g., 100 to 0), progress = (initial - current) / (initial - target) * 100
            WHEN COALESCE(target_value, 0) < COALESCE(initial_value, 0) THEN
              LEAST(GREATEST(((COALESCE(initial_value, 0) - current_value) / (COALESCE(initial_value, 0) - target_value)) * 100, 0), 100)
            ELSE 0
          END as progress
        FROM goal_metrics
        WHERE goal_id = ${goalId}
      ),
      unit_group_progress AS (
        -- Calculate average progress for each unit group (metrics with same units are grouped)
        SELECT unit, AVG(progress) as group_progress
        FROM metric_progress
        GROUP BY unit
      ),
      step_progress AS (
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN
              LEAST((COUNT(CASE WHEN completed = true THEN 1 END)::float / COUNT(*)) * 100, 100)
            ELSE 0
          END as progress
        FROM daily_steps 
        WHERE goal_id = ${goalId}
      ),
      all_progress_values AS (
        -- Collect progress from each unit group (metrics grouped by units)
        SELECT group_progress as progress FROM unit_group_progress
        UNION ALL
        -- Add step progress as a single value (if steps exist) - steps have same weight as one unit group
        SELECT progress FROM step_progress WHERE (SELECT COUNT(*) FROM daily_steps WHERE goal_id = ${goalId}) > 0
      ),
      combined_progress AS (
        SELECT 
          CASE 
            WHEN (SELECT COUNT(*) FROM all_progress_values) > 0 THEN
              -- Average of all progress values (each unit group + steps as one value)
              (SELECT AVG(progress) FROM all_progress_values)
            ELSE 0
          END as final_progress
      )
      UPDATE goals 
      SET 
        progress_percentage = COALESCE(
          (SELECT ROUND(final_progress) FROM combined_progress), 
          0
        ),
        updated_at = NOW()
      WHERE id = ${goalId}
      RETURNING progress_percentage
    `

    const updatedProgress = result[0]?.progress_percentage
    console.log(`Updated goal ${goalId} progress using combined formula (average of all metrics and steps): ${updatedProgress}%`)
    return result
  } catch (error) {
    console.error('Error updating goal progress with combined formula:', error)
    throw error
  }
}


export async function getAutomations(userId: string): Promise<Automation[]> {
  try {
    const automations = await sql`
      SELECT * FROM automations 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return automations as Automation[]
  } catch (error) {
    console.error('Error fetching automations:', error)
    return []
  }
}


export async function createAutomation(automationData: Omit<Automation, 'id' | 'created_at' | 'updated_at'>): Promise<Automation> {
  try {
    const id = crypto.randomUUID()
    
    // Check which optional columns exist
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'automations' 
      AND column_name IN ('trigger_type', 'action_type')
    `
    const columnNames = columns.map((row: any) => row.column_name)
    const hasTriggerType = columnNames.includes('trigger_type')
    const hasActionType = columnNames.includes('action_type')
    
    // Get allowed trigger_type value from constraint
    let triggerTypeValue = 'manual'
    if (hasTriggerType) {
      try {
        const constraintCheck = await sql`
          SELECT check_clause 
          FROM information_schema.check_constraints 
          WHERE constraint_name = 'automations_trigger_type_check'
        `
        if (constraintCheck.length > 0) {
          const checkClause = constraintCheck[0].check_clause
          // Extract first allowed value from constraint
          const match = checkClause.match(/'([^']+)'/)
          if (match) {
            triggerTypeValue = match[1]
          }
        }
      } catch (e: any) {
        // If we can't determine, use 'manual' as default
        triggerTypeValue = 'manual'
      }
    }
    
    // Get allowed action_type value from constraint
    let actionTypeValue = 'create'
    if (hasActionType) {
      try {
        const constraintCheck = await sql`
          SELECT check_clause 
          FROM information_schema.check_constraints 
          WHERE constraint_name = 'automations_action_type_check'
        `
        if (constraintCheck.length > 0) {
          const checkClause = constraintCheck[0].check_clause
          // Extract first allowed value from constraint
          const match = checkClause.match(/'([^']+)'/)
          if (match) {
            actionTypeValue = match[1]
          }
        }
      } catch (e: any) {
        // If we can't determine, use 'create' as default
        actionTypeValue = 'create'
      }
    }
    
    if (hasTriggerType && hasActionType) {
      // Both optional columns exist
      const automation = await sql`
        INSERT INTO automations (
          id, user_id, name, description, type, target_id, frequency_type, frequency_time,
          scheduled_date, is_active, target_value, current_value, update_value,
          update_frequency, update_day_of_week, update_day_of_month, trigger_type, action_type
        ) VALUES (
          ${id}, ${automationData.user_id}, ${automationData.name}, 
          ${automationData.description || null}, ${automationData.type}, 
          ${automationData.target_id}, ${automationData.frequency_type},
          ${automationData.frequency_time || null}, ${automationData.scheduled_date || null},
          ${automationData.is_active !== undefined ? automationData.is_active : true},
          ${automationData.target_value || null}, ${automationData.current_value || 0},
          ${automationData.update_value || null}, ${automationData.update_frequency || null},
          ${automationData.update_day_of_week || null}, ${automationData.update_day_of_month || null},
          ${triggerTypeValue}, ${actionTypeValue}
        ) RETURNING *
      `
      return automation[0] as Automation
    } else if (hasTriggerType) {
      // Only trigger_type exists
      const automation = await sql`
        INSERT INTO automations (
          id, user_id, name, description, type, target_id, frequency_type, frequency_time,
          scheduled_date, is_active, target_value, current_value, update_value,
          update_frequency, update_day_of_week, update_day_of_month, trigger_type
        ) VALUES (
          ${id}, ${automationData.user_id}, ${automationData.name}, 
          ${automationData.description || null}, ${automationData.type}, 
          ${automationData.target_id}, ${automationData.frequency_type},
          ${automationData.frequency_time || null}, ${automationData.scheduled_date || null},
          ${automationData.is_active !== undefined ? automationData.is_active : true},
          ${automationData.target_value || null}, ${automationData.current_value || 0},
          ${automationData.update_value || null}, ${automationData.update_frequency || null},
          ${automationData.update_day_of_week || null}, ${automationData.update_day_of_month || null},
          ${triggerTypeValue}
        ) RETURNING *
      `
      return automation[0] as Automation
    } else if (hasActionType) {
      // Only action_type exists
      const automation = await sql`
        INSERT INTO automations (
          id, user_id, name, description, type, target_id, frequency_type, frequency_time,
          scheduled_date, is_active, target_value, current_value, update_value,
          update_frequency, update_day_of_week, update_day_of_month, action_type
        ) VALUES (
          ${id}, ${automationData.user_id}, ${automationData.name}, 
          ${automationData.description || null}, ${automationData.type}, 
          ${automationData.target_id}, ${automationData.frequency_type},
          ${automationData.frequency_time || null}, ${automationData.scheduled_date || null},
          ${automationData.is_active !== undefined ? automationData.is_active : true},
          ${automationData.target_value || null}, ${automationData.current_value || 0},
          ${automationData.update_value || null}, ${automationData.update_frequency || null},
          ${automationData.update_day_of_week || null}, ${automationData.update_day_of_month || null},
          ${actionTypeValue}
        ) RETURNING *
      `
      return automation[0] as Automation
    } else {
      // Standard INSERT without trigger_type
      const automation = await sql`
        INSERT INTO automations (
          id, user_id, name, description, type, target_id, frequency_type, frequency_time,
          scheduled_date, is_active, target_value, current_value, update_value,
          update_frequency, update_day_of_week, update_day_of_month
        ) VALUES (
          ${id}, ${automationData.user_id}, ${automationData.name}, 
          ${automationData.description || null}, ${automationData.type}, 
          ${automationData.target_id}, ${automationData.frequency_type},
          ${automationData.frequency_time || null}, ${automationData.scheduled_date || null},
          ${automationData.is_active !== undefined ? automationData.is_active : true},
          ${automationData.target_value || null}, ${automationData.current_value || 0},
          ${automationData.update_value || null}, ${automationData.update_frequency || null},
          ${automationData.update_day_of_week || null}, ${automationData.update_day_of_month || null}
        ) RETURNING *
      `
      return automation[0] as Automation
    }
  } catch (error) {
    console.error('Error creating automation:', error)
    throw error
  }
}

export async function updateAutomation(automationId: string, updates: Partial<Omit<Automation, 'id' | 'user_id' | 'created_at'>>): Promise<Automation> {
  try {
    const automation = await sql`
      UPDATE automations 
      SET 
        name = COALESCE(${updates.name}, name),
        description = COALESCE(${updates.description}, description),
        type = COALESCE(${updates.type}, type),
        target_id = COALESCE(${updates.target_id}, target_id),
        frequency_type = COALESCE(${updates.frequency_type}, frequency_type),
        frequency_time = ${updates.frequency_time !== undefined ? updates.frequency_time : sql`frequency_time`},
        scheduled_date = ${updates.scheduled_date !== undefined ? updates.scheduled_date : sql`scheduled_date`},
        is_active = COALESCE(${updates.is_active}, is_active),
        target_value = ${updates.target_value !== undefined ? updates.target_value : sql`target_value`},
        current_value = ${updates.current_value !== undefined ? updates.current_value : sql`current_value`},
        update_value = ${updates.update_value !== undefined ? updates.update_value : sql`update_value`},
        update_frequency = ${updates.update_frequency !== undefined ? updates.update_frequency : sql`update_frequency`},
        update_day_of_week = ${updates.update_day_of_week !== undefined ? updates.update_day_of_week : sql`update_day_of_week`},
        update_day_of_month = ${updates.update_day_of_month !== undefined ? updates.update_day_of_month : sql`update_day_of_month`},
        updated_at = NOW()
      WHERE id = ${automationId}
      RETURNING *
    `
    return automation[0] as Automation
  } catch (error) {
    console.error('Error updating automation:', error)
    throw error
  }
}

export async function deleteAutomation(automationId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM automations 
      WHERE id = ${automationId}
    `
  } catch (error) {
    console.error('Error deleting automation:', error)
    throw error
  }
}


// User Settings functions
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const settings = await sql`
      SELECT * FROM user_settings 
      WHERE user_id = ${userId}
    `
    return settings[0] as UserSettings || null
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return null
  }
}

export async function createOrUpdateUserSettings(
  userId: string, 
  dailyStepsCount?: number, 
  workflow?: 'daily_planning' | 'no_workflow',
  dailyResetHour?: number,
  filters?: UserSettings['filters'],
  defaultView?: 'day' | 'week' | 'month' | 'year',
  dateFormat?: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY',
  primaryColor?: string,
  defaultCurrency?: string,
  weightUnitPreference?: 'kg' | 'lbs',
  assistantEnabled?: boolean
): Promise<UserSettings> {
  try {
    // Ensure default_view column exists (migration on-the-fly)
    try {
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_view VARCHAR(10) DEFAULT 'day'`
    } catch (migrationError) {
      // Column might already exist, continue
      console.log('Note: default_view column check:', migrationError instanceof Error ? migrationError.message : 'unknown')
    }
    
    // Ensure date_format column exists (migration on-the-fly)
    try {
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY'`
    } catch (migrationError) {
      // Column might already exist, continue
      console.log('Note: date_format column check:', migrationError instanceof Error ? migrationError.message : 'unknown')
    }
    
    // Ensure primary_color column exists (migration on-the-fly)
    try {
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7)`
    } catch (migrationError) {
      // Column might already exist, continue
      console.log('Note: primary_color column check:', migrationError instanceof Error ? migrationError.message : 'unknown')
    }
    
    // Ensure default_currency column exists (migration on-the-fly)
    try {
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_currency VARCHAR(10)`
    } catch (migrationError) {
      // Column might already exist, continue
      console.log('Note: default_currency column check:', migrationError instanceof Error ? migrationError.message : 'unknown')
    }
    
    // Ensure weight_unit_preference column exists (migration on-the-fly)
    try {
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS weight_unit_preference VARCHAR(5) DEFAULT 'kg'`
      // Try to add check constraint if it doesn't exist
      try {
        await sql`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'user_settings_weight_unit_preference_check'
            ) THEN
              ALTER TABLE user_settings 
              ADD CONSTRAINT user_settings_weight_unit_preference_check 
              CHECK (weight_unit_preference IN ('kg', 'lbs'));
            END IF;
          END $$;
        `
      } catch (constraintError) {
        // Constraint might already exist, ignore
      }
    } catch (migrationError) {
      // Column might already exist, continue
      console.log('Note: weight_unit_preference column check:', migrationError instanceof Error ? migrationError.message : 'unknown')
    }
    
    // Ensure assistant_enabled column exists (migration on-the-fly)
    try {
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS assistant_enabled BOOLEAN DEFAULT TRUE`
    } catch (migrationError) {
      // Column might already exist, continue
      console.log('Note: assistant_enabled column check:', migrationError instanceof Error ? migrationError.message : 'unknown')
    }
    
    // Get existing settings to preserve values not being updated
    const existingSettings = await getUserSettings(userId)
    
    const finalDailyStepsCount = dailyStepsCount !== undefined ? dailyStepsCount : (existingSettings?.daily_steps_count ?? 3)
    const finalWorkflow = workflow !== undefined ? workflow : (existingSettings?.workflow ?? 'daily_planning')
    const finalDailyResetHour = dailyResetHour !== undefined ? dailyResetHour : (existingSettings?.daily_reset_hour ?? 0)
    const finalDefaultView = defaultView !== undefined ? defaultView : (existingSettings?.default_view ?? 'day')
    const finalDateFormat = dateFormat !== undefined ? dateFormat : (existingSettings?.date_format ?? 'DD.MM.YYYY')
    const finalPrimaryColor = primaryColor !== undefined ? primaryColor : existingSettings?.primary_color ?? null
    const finalDefaultCurrency = defaultCurrency !== undefined ? defaultCurrency : existingSettings?.default_currency ?? null
    const finalWeightUnitPreference = weightUnitPreference !== undefined ? weightUnitPreference : (existingSettings?.weight_unit_preference ?? 'kg')
    const finalAssistantEnabled = assistantEnabled !== undefined ? assistantEnabled : (existingSettings?.assistant_enabled ?? true)
    const finalFilters = filters !== undefined ? filters : (existingSettings?.filters ?? {
      showToday: true,
      showOverdue: true,
      showFuture: false,
      showWithGoal: true,
      showWithoutGoal: true,
      sortBy: 'date' as const
    })
    
    const settings = await sql`
      INSERT INTO user_settings (id, user_id, daily_steps_count, workflow, daily_reset_hour, filters, default_view, date_format, primary_color, default_currency, weight_unit_preference, assistant_enabled)
      VALUES (${crypto.randomUUID()}, ${userId}, ${finalDailyStepsCount}, ${finalWorkflow}, ${finalDailyResetHour}, ${JSON.stringify(finalFilters)}, ${finalDefaultView}, ${finalDateFormat}, ${finalPrimaryColor}, ${finalDefaultCurrency}, ${finalWeightUnitPreference}, ${finalAssistantEnabled})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        daily_steps_count = ${finalDailyStepsCount},
        workflow = ${finalWorkflow},
        daily_reset_hour = ${finalDailyResetHour},
        filters = ${JSON.stringify(finalFilters)},
        default_view = ${finalDefaultView},
        date_format = ${finalDateFormat},
        primary_color = ${finalPrimaryColor},
        default_currency = ${finalDefaultCurrency},
        weight_unit_preference = ${finalWeightUnitPreference},
        assistant_enabled = ${finalAssistantEnabled},
        updated_at = NOW()
      RETURNING *
    `
    return settings[0] as UserSettings
  } catch (error) {
    console.error('Error creating/updating user settings:', error)
    throw error
  }
}


// Areas functions
export async function createArea(
  userId: string,
  name: string,
  description?: string,
  color: string = '#3B82F6',
  icon?: string,
  order: number = 0
): Promise<Area> {
  try {
    // Encrypt text fields before inserting
    const encryptedName = name ? encrypt(name, userId) : null
    const encryptedDescription = description ? encrypt(description, userId) : null
    
    const area = await sql`
      INSERT INTO areas (id, user_id, name, description, color, icon, "order")
      VALUES (${crypto.randomUUID()}, ${userId}, ${encryptedName}, ${encryptedDescription}, ${color}, ${icon || null}, ${order})
      RETURNING *
    `
    
    // Decrypt before returning (so API returns decrypted data)
    return decryptFields(area[0], userId, ['name', 'description']) as Area
  } catch (error) {
    console.error('Error creating area:', error)
    throw error
  }
}

export async function getAreas(userId: string): Promise<Area[]> {
  try {
    const areas = await sql`
      SELECT * FROM areas 
      WHERE user_id = ${userId} 
      ORDER BY "order" ASC, created_at ASC
    `
    
    // Decrypt all areas
    return areas.map(area => decryptFields(area, userId, ['name', 'description'])) as Area[]
  } catch (error) {
    console.error('Error fetching areas:', error)
    return []
  }
}

export async function updateArea(
  areaId: string,
  updates: Partial<Pick<Area, 'name' | 'description' | 'color' | 'icon' | 'order'>>
): Promise<Area> {
  try {
    // First get the area to know the user_id
    const existing = await sql`SELECT user_id FROM areas WHERE id = ${areaId}`
    if (existing.length === 0) {
      throw new Error('Area not found')
    }
    const userId = existing[0].user_id
    
    // Encrypt text fields that are being updated
    const encryptedUpdates: any = { ...updates }
    if (updates.name !== undefined) {
      encryptedUpdates.name = updates.name ? encrypt(updates.name, userId) : null
    }
    if (updates.description !== undefined) {
      encryptedUpdates.description = updates.description ? encrypt(updates.description, userId) : null
    }
    
    const setParts = []
    const values = []
    
    if (encryptedUpdates.name !== undefined) {
      setParts.push(`name = $${setParts.length + 1}`)
      values.push(encryptedUpdates.name)
    }
    if (encryptedUpdates.description !== undefined) {
      setParts.push(`description = $${setParts.length + 1}`)
      values.push(encryptedUpdates.description)
    }
    if (updates.color !== undefined) {
      setParts.push(`color = $${setParts.length + 1}`)
      values.push(updates.color)
    }
    if (updates.icon !== undefined) {
      setParts.push(`icon = $${setParts.length + 1}`)
      values.push(updates.icon)
    }
    if (updates.order !== undefined) {
      setParts.push(`"order" = $${setParts.length + 1}`)
      values.push(updates.order)
    }
    
    if (setParts.length === 0) {
      throw new Error('No updates provided')
    }
    
    setParts.push('updated_at = NOW()')
    
    // Use a safer approach with template literals
    const query = `
      UPDATE areas 
      SET ${setParts.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `
    
    const area = await sql.query(query, [...values, areaId])
    
    // Decrypt before returning
    return decryptFields(area[0], userId, ['name', 'description']) as Area
  } catch (error) {
    console.error('Error updating area:', error)
    throw error
  }
}

export async function deleteArea(areaId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM areas 
      WHERE id = ${areaId}
    `
  } catch (error) {
    console.error('Error deleting area:', error)
    throw error
  }
}

export async function createPlayer(playerData: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player | null> {
  try {
    const id = crypto.randomUUID()
    const result = await sql`
      INSERT INTO players (
        id, user_id, name, gender, avatar, appearance, 
        level, experience, energy, current_day, "current_time"
      ) VALUES (
        ${id}, ${playerData.user_id}, ${playerData.name}, ${playerData.gender}, 
        ${playerData.avatar}, ${JSON.stringify(playerData.appearance)}, 
        ${playerData.level}, ${playerData.experience}, ${playerData.energy}, 
        ${playerData.current_day}, ${playerData.current_time}
      ) RETURNING *
    `
    return result[0] as Player
  } catch (error) {
    console.error('Error creating player:', error)
    return null
  }
}

export async function getPlayerByUserId(userId: string): Promise<Player | null> {
  try {
    const result = await sql`
      SELECT * FROM players 
      WHERE user_id = ${userId}
      LIMIT 1
    `
    return result[0] as Player || null
  } catch (error) {
    console.error('Error fetching player by user ID:', error)
    return null
  }
}

export async function updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player | null> {
  try {
    const updateFields = []
    const updateValues = []
    
    if (updates.name) {
      updateFields.push('name = ?')
      updateValues.push(updates.name)
    }
    if (updates.level !== undefined) {
      updateFields.push('level = ?')
      updateValues.push(updates.level)
    }
    if (updates.experience !== undefined) {
      updateFields.push('experience = ?')
      updateValues.push(updates.experience)
    }
    if (updates.energy !== undefined) {
      updateFields.push('energy = ?')
      updateValues.push(updates.energy)
    }
    if (updates.current_day !== undefined) {
      updateFields.push('current_day = ?')
      updateValues.push(updates.current_day)
    }
    if (updates.current_time !== undefined) {
      updateFields.push('"current_time" = ?')
      updateValues.push(updates.current_time)
    }
    
    updateFields.push('updated_at = NOW()')
    
    const result = await sql`
      UPDATE players 
      SET ${sql.unsafe(updateFields.join(', '))}
      WHERE id = ${playerId}
      RETURNING *
    `
    return result[0] as Player
  } catch (error) {
    console.error('Error updating player:', error)
    return null
  }
}

export async function createHabit(habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit | null> {
  try {
    const id = crypto.randomUUID()
    
    // Check if start_date column exists, if not add it
    try {
      const startDateColumnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'habits' AND column_name = 'start_date'
      `
      if (startDateColumnCheck.length === 0) {
        console.log('createHabit: Adding start_date column to habits table')
        await sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE`
      }
    } catch (columnError) {
      console.warn('createHabit: Could not check/add start_date column:', columnError)
    }
    
    // Set start_date to today if not provided
    const startDate = (habitData as any).start_date || new Date().toISOString().split('T')[0]
    
    // Encrypt name and description before inserting
    const encryptedName = habitData.name ? encrypt(habitData.name, habitData.user_id) : null
    const encryptedDescription = habitData.description ? encrypt(habitData.description, habitData.user_id) : null
    
    const result = await sql`
      INSERT INTO habits (
        id, user_id, name, description, frequency, streak, 
        max_streak, category, difficulty, is_custom, reminder_time, notification_enabled, selected_days, xp_reward, aspiration_id, area_id, icon, "order", start_date
      ) VALUES (
        ${id}, ${habitData.user_id}, ${encryptedName}, ${encryptedDescription}, 
        ${habitData.frequency}, ${habitData.streak}, ${habitData.max_streak}, 
        ${habitData.category}, ${habitData.difficulty}, ${habitData.is_custom}, ${habitData.reminder_time}, ${(habitData as any).notification_enabled || false}, ${habitData.selected_days}, ${habitData.xp_reward}, ${habitData.aspiration_id || null}, ${habitData.area_id || null}, ${habitData.icon || null}, ${(habitData as any).order || 0}, ${startDate}
      ) RETURNING *
    `
    
    if (result.length === 0) {
      return null
    }
    
    // Invalidate habits cache for this user
    invalidateHabitsCache(habitData.user_id)
    
    // Decrypt before returning
    return decryptFields(result[0], habitData.user_id, ['name', 'description']) as Habit
  } catch (error) {
    console.error('Error creating habit:', error)
    return null
  }
}

export async function updateHabit(habitId: string, updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Habit | null> {
  try {
    // Check if icon column exists, if not add it
    try {
      const iconColumnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'habits' AND column_name = 'icon'
      `
      if (iconColumnCheck.length === 0) {
        console.log('updateHabit: Adding icon column to habits table')
        await sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon VARCHAR(50)`
      }
    } catch (columnError) {
      console.warn('updateHabit: Could not check/add icon column:', columnError)
    }
    
    // Check if start_date column exists, if not add it
    try {
      const startDateColumnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'habits' AND column_name = 'start_date'
      `
      if (startDateColumnCheck.length === 0) {
        console.log('updateHabit: Adding start_date column to habits table')
        await sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE`
      }
    } catch (columnError) {
      console.warn('updateHabit: Could not check/add start_date column:', columnError)
    }
    
    // Get user_id first to invalidate cache
    const habit = await sql`SELECT user_id FROM habits WHERE id = ${habitId} LIMIT 1`
    if (habit.length === 0) {
      console.error('updateHabit: Habit not found:', habitId)
      return null
    }
    const userId = habit[0].user_id
    
    console.log('updateHabit: Updating habit:', { habitId, updates })
    
    // Encrypt name and description if they are being updated
    const encryptedName = updates.name !== undefined ? (updates.name ? encrypt(updates.name, userId) : null) : undefined
    const encryptedDescription = updates.description !== undefined ? (updates.description ? encrypt(updates.description, userId) : null) : undefined
    
    const result = await sql`
      UPDATE habits 
      SET 
        name = ${encryptedName !== undefined ? encryptedName : sql`name`},
        description = ${encryptedDescription !== undefined ? encryptedDescription : sql`description`},
        frequency = COALESCE(${updates.frequency}, frequency),
        category = COALESCE(${updates.category}, category),
        difficulty = COALESCE(${updates.difficulty}, difficulty),
        reminder_time = COALESCE(${updates.reminder_time}, reminder_time),
        notification_enabled = COALESCE(${(updates as any).notification_enabled}, notification_enabled),
        selected_days = COALESCE(${updates.selected_days}, selected_days),
        xp_reward = COALESCE(${updates.xp_reward}, xp_reward),
        aspiration_id = ${updates.aspiration_id !== undefined ? updates.aspiration_id : null},
        area_id = ${updates.area_id !== undefined ? updates.area_id : null},
        icon = ${updates.icon !== undefined ? updates.icon : sql`icon`},
        start_date = ${(updates as any).start_date !== undefined ? (updates as any).start_date : sql`start_date`},
        "order" = COALESCE(${(updates as any).order}, "order"),
        updated_at = NOW()
      WHERE id = ${habitId}
      RETURNING *
    `
    
    console.log('updateHabit: Update result:', { habitId, resultLength: result.length })
    
    if (result.length === 0) {
      console.error('updateHabit: UPDATE returned no rows:', { habitId })
      return null
    }
    
    // Invalidate habits cache for this user
    invalidateHabitsCache(userId)
    
    // Decrypt before returning
    return decryptFields(result[0], userId, ['name', 'description']) as Habit
  } catch (error) {
    console.error('Error updating habit:', error)
    console.error('Error details:', { habitId, updates, errorMessage: error instanceof Error ? error.message : String(error) })
    return null
  }
}

export async function getHabitsByUserId(userId: string, forceFresh: boolean = false): Promise<Habit[]> {
  try {
    // If forceFresh is true, skip cache entirely
    if (!forceFresh) {
      // Check cache first
      cleanupHabitsCache()
      const cached = habitsCache.get(userId)
      if (cached && (Date.now() - cached.timestamp) < HABITS_CACHE_TTL) {
        return cached.habits as Habit[]
      }
    } else {
      // Force fresh - invalidate cache
      habitsCache.delete(userId)
    }

    // Only load completions from last 90 days to avoid loading excessive historical data
    const result = await sql`
      SELECT h.*, 
             COALESCE(
               json_object_agg(
                 TO_CHAR(hc.completion_date, 'YYYY-MM-DD'), 
                 hc.completed
               ) FILTER (WHERE hc.completion_date IS NOT NULL),
               '{}'::json
             ) as habit_completions
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
        AND hc.completion_date >= CURRENT_DATE - INTERVAL '90 days'
      WHERE h.user_id = ${userId}
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `
    
    const habits = result.map((habit: any) => {
      const habitWithCompletions = {
        ...habit,
        habit_completions: habit.habit_completions || {}
      }
      // Decrypt name and description
      return decryptFields(habitWithCompletions, userId, ['name', 'description'])
    }) as Habit[]
    
    // Cache the result
    if (habitsCache.size < MAX_CACHE_SIZE) {
      habitsCache.set(userId, { habits, timestamp: Date.now() })
    }
    
    return habits
  } catch (error) {
    console.error('Error fetching habits by user ID:', error)
    return []
  }
}

// Function to invalidate habits cache for a user (call after habit updates)
export function invalidateHabitsCache(userId: string): void {
  habitsCache.delete(userId)
}


export async function deleteHabit(habitId: string): Promise<boolean> {
  try {
    // Get user_id first to invalidate cache
    const habit = await sql`SELECT user_id FROM habits WHERE id = ${habitId} LIMIT 1`
    if (habit.length > 0) {
      const userId = habit[0].user_id
      await sql`DELETE FROM habits WHERE id = ${habitId}`
      // Invalidate habits cache for this user
      invalidateHabitsCache(userId)
    } else {
      await sql`DELETE FROM habits WHERE id = ${habitId}`
    }
    return true
  } catch (error) {
    console.error('Error deleting habit:', error)
    return false
  }
}

export async function toggleHabitCompletion(userId: string, habitId: string, date?: string) {
  try {
    const today = date || new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Check if habit was completed today
    const existingCompletion = await sql`
      SELECT id FROM habit_completions 
      WHERE user_id = ${userId} AND habit_id = ${habitId} AND completion_date = ${today}
    `
    
    if (existingCompletion.length > 0) {
      // Remove completion (mark as not completed)
      await sql`
        DELETE FROM habit_completions 
        WHERE user_id = ${userId} AND habit_id = ${habitId} AND completion_date = ${today}
      `
      
      // Update streak
      const habit = await sql`
        SELECT streak FROM habits WHERE id = ${habitId} AND user_id = ${userId}
      `
      
      const newStreak = Math.max(0, (habit[0]?.streak || 0) - 1)
      await sql`
        UPDATE habits SET streak = ${newStreak} WHERE id = ${habitId} AND user_id = ${userId}
      `
      
      // Invalidate habits cache for this user
      invalidateHabitsCache(userId)
      
      return { completed: false, streak: newStreak }
    } else {
      // Add completion (mark as completed)
      await sql`
        INSERT INTO habit_completions (user_id, habit_id, completion_date, completed, created_at)
        VALUES (${userId}, ${habitId}, ${today}, true, NOW())
      `
      
      // Update streak
      const habit = await sql`
        SELECT streak FROM habits WHERE id = ${habitId} AND user_id = ${userId}
      `
      
      const newStreak = (habit[0]?.streak || 0) + 1
      await sql`
        UPDATE habits SET streak = ${newStreak} WHERE id = ${habitId} AND user_id = ${userId}
      `
      
      // Invalidate habits cache for this user
      invalidateHabitsCache(userId)
      
      return { completed: true, streak: newStreak }
    }
  } catch (error) {
    console.error('Error toggling habit completion:', error)
    throw error
  }
}