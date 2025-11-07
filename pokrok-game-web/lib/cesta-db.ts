import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export interface User {
  id: string
  clerk_user_id: string
  email: string
  name: string
  has_completed_onboarding: boolean
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
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  priority: 'meaningful' | 'nice-to-have'
  category: 'short-term' | 'medium-term' | 'long-term'
  goal_type: 'process' | 'outcome'
  progress_percentage: number
  progress_type: 'percentage' | 'count' | 'amount' | 'steps'
  progress_target?: number
  progress_current?: number
  progress_unit?: string
  icon?: string
  area_id?: string
  aspiration_id?: string
  created_at: string | Date
  updated_at: string | Date
}

export interface DailyStep {
  id: string
  user_id: string
  goal_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: Date
  date: Date
  is_important: boolean
  is_urgent: boolean
  created_at: Date
  step_type: 'update' | 'revision' | 'custom'
  custom_type_name?: string
  deadline?: Date
  metric_id?: string
  area_id?: string
  isCompleting?: boolean // Loading state for completion
  estimated_time?: number
  xp_reward?: number
}

export interface Metric {
  id: string
  user_id: string
  step_id: string
  name: string
  description?: string
  target_value: number
  current_value: number
  unit: string
  created_at: Date
  updated_at: Date
}

export interface GoalMetric {
  id: string
  user_id: string
  goal_id: string
  name: string
  description?: string
  type: 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'custom'
  unit: string
  target_value: number
  current_value: number
  created_at: Date
  updated_at: Date
}

export interface GoalMilestone {
  id: string
  user_id: string
  goal_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: Date
  order: number
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
  target_metric_id?: string
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
  selected_days: string[] | null
  habit_completions: { [date: string]: boolean | null } | null
  always_show: boolean
  xp_reward: number
  aspiration_id?: string
  created_at: Date
  updated_at: Date
}

export interface UserSettings {
  id: string
  user_id: string
  daily_steps_count: number
  workflow: 'daily_planning' | 'no_workflow'
  daily_reset_hour: number
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
        always_show BOOLEAN DEFAULT FALSE,
        xp_reward INTEGER DEFAULT 0,
        aspiration_id VARCHAR(255) REFERENCES aspirations(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

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
        step_type VARCHAR(20) DEFAULT 'custom' CHECK (step_type IN ('update', 'revision', 'custom')),
        custom_type_name VARCHAR(255),
        deadline DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create metrics table (legacy - for step metrics)
    await sql`
      CREATE TABLE IF NOT EXISTS metrics (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        step_id VARCHAR(255) NOT NULL REFERENCES daily_steps(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        target_value DECIMAL(10,2) NOT NULL,
        current_value DECIMAL(10,2) DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create goal_metrics table (new - for goal-level metrics)
    await sql`
      CREATE TABLE IF NOT EXISTS goal_metrics (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'currency', 'percentage', 'distance', 'time', 'custom')),
        unit VARCHAR(50) NOT NULL,
        target_value DECIMAL(10,2) NOT NULL,
        current_value DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create goal_milestones table
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

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
        target_metric_id VARCHAR(255) REFERENCES metrics(id) ON DELETE CASCADE,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
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

    // Add metric_id column to daily_steps table
    await sql`
      ALTER TABLE daily_steps 
      ADD COLUMN IF NOT EXISTS metric_id VARCHAR(255) REFERENCES metrics(id) ON DELETE SET NULL
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_values_user_id ON values(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_values_is_custom ON values(is_custom)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_id ON daily_steps(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_goal_id ON daily_steps(goal_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_date ON daily_steps(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_completed ON daily_steps(completed)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_deadline ON daily_steps(deadline)`
    await sql`CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON metrics(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_metrics_step_id ON metrics(step_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goal_metrics_user_id ON goal_metrics(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goal_metrics_goal_id ON goal_metrics(goal_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goal_milestones_user_id ON goal_milestones(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goal_milestones_completed ON goal_milestones(completed)`
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
    const users = await sql`
      SELECT * FROM users 
      WHERE clerk_user_id = ${clerkUserId}
      LIMIT 1
    `
    return users[0] as User || null
  } catch (error) {
    console.error('Error fetching user by clerk ID:', error)
    return null
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

// Needed Steps Settings functions
export async function getNeededStepsSettings(userId: string): Promise<NeededStepsSettings | null> {
  try {
    const result = await sql`
      SELECT * FROM needed_steps_settings 
      WHERE user_id = ${userId}
    `
    return result.length > 0 ? result[0] as NeededStepsSettings : null
  } catch (error) {
    console.error('Error fetching needed steps settings:', error)
    return null
  }
}

export async function createNeededStepsSettings(userId: string, settings: Partial<NeededStepsSettings>): Promise<NeededStepsSettings> {
  try {
    const id = crypto.randomUUID()
    const result = await sql`
      INSERT INTO needed_steps_settings (
        id, user_id, enabled, days_of_week, time_hour, time_minute
      ) VALUES (
        ${id}, ${userId}, ${settings.enabled || false}, 
        ${settings.days_of_week || [1,2,3,4,5]}, 
        ${settings.time_hour || 9}, 
        ${settings.time_minute || 0}
      ) RETURNING *
    `
    return result[0] as NeededStepsSettings
  } catch (error) {
    console.error('Error creating needed steps settings:', error)
    throw error
  }
}

export async function updateNeededStepsSettings(userId: string, settings: Partial<NeededStepsSettings>): Promise<NeededStepsSettings> {
  try {
    const result = await sql`
      UPDATE needed_steps_settings 
      SET 
        enabled = ${settings.enabled},
        days_of_week = ${settings.days_of_week},
        time_hour = ${settings.time_hour},
        time_minute = ${settings.time_minute},
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `
    
    if (result.length === 0) {
      throw new Error('Settings not found')
    }
    
    return result[0] as NeededStepsSettings
  } catch (error) {
    console.error('Error updating needed steps settings:', error)
    throw error
  }
}

export async function upsertNeededStepsSettings(userId: string, settings: Partial<NeededStepsSettings>): Promise<NeededStepsSettings> {
  try {
    const existing = await getNeededStepsSettings(userId)
    
    if (existing) {
      return await updateNeededStepsSettings(userId, settings)
    } else {
      return await createNeededStepsSettings(userId, settings)
    }
  } catch (error) {
    console.error('Error upserting needed steps settings:', error)
    throw error
  }
}

export async function createUser(clerkUserId: string, email: string, name: string): Promise<User> {
  const id = crypto.randomUUID()
  const user = await sql`
    INSERT INTO users (id, clerk_user_id, email, name, has_completed_onboarding)
    VALUES (${id}, ${clerkUserId}, ${email}, ${name}, false)
    RETURNING *
  `
  return user[0] as User
}

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  try {
    const goals = await sql`
      SELECT g.*, a.name as area_name
      FROM goals g
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.user_id = ${userId}
      ORDER BY g.created_at DESC
    `
    return goals as Goal[]
  } catch (error) {
    console.error('Error fetching goals:', error)
    return []
  }
}

// MARK: - Aspiration Functions

export async function getAspirationsByUserId(userId: string): Promise<Aspiration[]> {
  try {
    const aspirations = await sql`
      SELECT * FROM aspirations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return aspirations as Aspiration[]
  } catch (error) {
    console.error('Error fetching aspirations:', error)
    return []
  }
}

export async function createAspiration(aspirationData: Partial<Aspiration>): Promise<Aspiration> {
  const id = crypto.randomUUID()
  
  const aspiration = await sql`
    INSERT INTO aspirations (
      id, user_id, title, description, color, icon
    ) VALUES (
      ${id}, ${aspirationData.user_id}, ${aspirationData.title}, 
      ${aspirationData.description || null}, 
      ${aspirationData.color || '#3B82F6'}, 
      ${aspirationData.icon || null}
    ) RETURNING *
  `
  return aspiration[0] as Aspiration
}

export async function updateAspiration(aspirationId: string, updates: Partial<Aspiration>): Promise<Aspiration | null> {
  try {
    if (updates.title !== undefined) {
      await sql`UPDATE aspirations SET title = ${updates.title}, updated_at = NOW() WHERE id = ${aspirationId}`
    }
    if (updates.description !== undefined) {
      await sql`UPDATE aspirations SET description = ${updates.description}, updated_at = NOW() WHERE id = ${aspirationId}`
    }
    if (updates.color !== undefined) {
      await sql`UPDATE aspirations SET color = ${updates.color}, updated_at = NOW() WHERE id = ${aspirationId}`
    }
    if (updates.icon !== undefined) {
      await sql`UPDATE aspirations SET icon = ${updates.icon}, updated_at = NOW() WHERE id = ${aspirationId}`
    }
    
    const result = await sql`SELECT * FROM aspirations WHERE id = ${aspirationId}`
    return result[0] as Aspiration || null
  } catch (error) {
    console.error('Error updating aspiration:', error)
    throw error
  }
}

export async function deleteAspiration(aspirationId: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM aspirations 
      WHERE id = ${aspirationId}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error('Error deleting aspiration:', error)
    throw error
  }
}

export interface AspirationBalance {
  aspiration_id: string
  total_xp: number
  recent_xp: number // Last 90 days
  total_completed_steps: number
  recent_completed_steps: number
  total_completed_habits: number
  recent_completed_habits: number
  total_planned_steps: number
  recent_planned_steps: number
  total_planned_habits: number
  recent_planned_habits: number
  completion_rate_all_time: number // percentage
  completion_rate_recent: number // percentage
  trend: 'positive' | 'negative' | 'neutral' // comparing recent vs all-time
}

export async function getAspirationBalance(userId: string, aspirationId: string): Promise<AspirationBalance> {
  try {
    console.log('=== getAspirationBalance START ===')
    console.log('Input parameters:', { userId, aspirationId })
    const now = new Date()
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    console.log('Time range:', { now: now.toISOString(), ninetyDaysAgo: ninetyDaysAgo.toISOString() })
    
    // Get all goals for this aspiration
    const goals = await sql`
      SELECT id FROM goals
      WHERE user_id = ${userId} AND aspiration_id = ${aspirationId}
    `
    console.log('Goals query result:', goals)
    console.log('Goals for aspiration:', goals.length)
    const goalIds = goals.map((g: any) => g.id)
    console.log('Goal IDs:', goalIds)
    
    // Get all habits for this aspiration
    // First, let's check all habits for this user to see what aspiration_id they have
    const allUserHabits = await sql`
      SELECT id, name, aspiration_id FROM habits
      WHERE user_id = ${userId}
    `
    console.log('🔍 All habits for user:', allUserHabits.map((h: any) => ({
      id: h.id,
      name: h.name,
      aspiration_id: h.aspiration_id
    })))
    
    // Get habits with their completions from habit_completions JSON field
    // We need to use getHabitsByUserId to get the habit_completions JSON, or query it directly
    const habits = await sql`
      SELECT h.id, h.frequency, h.selected_days, h.created_at, h.xp_reward,
             COALESCE(
               json_object_agg(
                 hc.completion_date, 
                 hc.completed
               ) FILTER (WHERE hc.completion_date IS NOT NULL),
               '{}'::json
             ) as habit_completions
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = ${userId} AND h.aspiration_id = ${aspirationId}
      GROUP BY h.id, h.frequency, h.selected_days, h.created_at, h.xp_reward
    `
    console.log('Habits query result:', habits)
    console.log('Habits for aspiration:', habits.length)
    console.log('🔍 Looking for habits with aspiration_id:', aspirationId)
    const habitIds = habits.map((h: any) => h.id)
    console.log('Habit IDs:', habitIds)
    console.log('Habit details:', habits.map((h: any) => ({
      id: h.id,
      frequency: h.frequency,
      selected_days: h.selected_days,
      created_at: h.created_at
    })))
    
    // If no goals and no habits, return empty balance
    if (goalIds.length === 0 && habitIds.length === 0) {
      console.log('❌ Aspiration has no goals or habits, returning empty balance')
      return {
        aspiration_id: aspirationId,
        total_xp: 0,
        recent_xp: 0,
        total_completed_steps: 0,
        recent_completed_steps: 0,
        total_completed_habits: 0,
        recent_completed_habits: 0,
        total_planned_steps: 0,
        recent_planned_steps: 0,
        total_planned_habits: 0,
        recent_planned_habits: 0,
        completion_rate_all_time: 0,
        completion_rate_recent: 0,
        trend: 'neutral'
      }
    }
    
    console.log('✅ Aspiration has goals or habits, proceeding with calculation')
    
    // Calculate step statistics
    let stepStats: any = {
      total_completed: 0,
      total_planned: 0,
      recent_completed: 0,
      recent_planned: 0,
      total_xp: 0,
      recent_xp: 0
    }
    
    if (goalIds.length > 0) {
      try {
        console.log('📊 Calculating step stats for goalIds:', goalIds)
        const stepQuery = await sql`
          SELECT 
            COUNT(*) FILTER (WHERE completed = true) as total_completed,
            COUNT(*) as total_planned,
            COUNT(*) FILTER (WHERE completed = true AND date >= ${ninetyDaysAgo}) as recent_completed,
            COUNT(*) FILTER (WHERE date >= ${ninetyDaysAgo}) as recent_planned,
            COALESCE(SUM(xp_reward) FILTER (WHERE completed = true), 0)::bigint as total_xp,
            COALESCE(SUM(xp_reward) FILTER (WHERE completed = true AND date >= ${ninetyDaysAgo}), 0)::bigint as recent_xp
          FROM daily_steps
          WHERE goal_id = ANY(${sql.array(goalIds)})
        `
        stepStats = stepQuery[0] || stepStats
        console.log('📊 Step stats result:', stepStats)
        console.log('📊 Step stats parsed:', {
          total_completed: parseInt(String(stepStats.total_completed || 0)),
          total_planned: parseInt(String(stepStats.total_planned || 0)),
          recent_completed: parseInt(String(stepStats.recent_completed || 0)),
          recent_planned: parseInt(String(stepStats.recent_planned || 0)),
          total_xp: parseInt(String(stepStats.total_xp || 0)),
          recent_xp: parseInt(String(stepStats.recent_xp || 0))
        })
      } catch (error: any) {
        console.error('❌ Error calculating step stats:', error)
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          detail: error?.detail
        })
        // Don't throw, just use empty stats
      }
    } else {
      console.log('⏭️  No goals, skipping step stats calculation')
    }
    
    // Calculate habit statistics
    let habitStats: any = {
      total_completed: 0,
      total_planned: 0,
      recent_completed: 0,
      recent_planned: 0,
      total_xp: 0,
      recent_xp: 0
    }
    
    if (habitIds.length > 0) {
      try {
        console.log('🔄 Calculating habit stats for habitIds:', habitIds)
        console.log('🔄 Habits with completions:', habits.map((h: any) => ({
          id: h.id,
          habit_completions: h.habit_completions
        })))
        
        // Calculate completions from habit_completions JSON field in habits table
        let totalCompleted = 0
        let recentCompleted = 0
        let totalXp = 0
        let recentXp = 0
        
        for (const habit of habits) {
          const completions = habit.habit_completions || {}
          const xpReward = habit.xp_reward || 0
          
          // Count all completions (where value is true)
          const allCompletions = Object.entries(completions).filter(([date, completed]) => completed === true)
          totalCompleted += allCompletions.length
          totalXp += allCompletions.length * xpReward
          
          // Count recent completions (last 90 days)
          const recentCompletions = allCompletions.filter(([date]) => {
            const completionDate = new Date(date)
            return completionDate >= ninetyDaysAgo
          })
          recentCompleted += recentCompletions.length
          recentXp += recentCompletions.length * xpReward
        }
        
        habitStats.total_completed = totalCompleted
        habitStats.recent_completed = recentCompleted
        habitStats.total_xp = totalXp
        habitStats.recent_xp = recentXp
        
        console.log('🔄 Habit completions calculated from JSON:', {
          total_completed: habitStats.total_completed,
          recent_completed: habitStats.recent_completed,
          total_xp: habitStats.total_xp,
          recent_xp: habitStats.recent_xp
        })
      } catch (error: any) {
        console.error('❌ Error calculating habit stats:', error)
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          detail: error?.detail
        })
        // If there's an error, return empty stats
        habitStats = {
          total_completed: 0,
          total_planned: 0,
          recent_completed: 0,
          recent_planned: 0,
          total_xp: 0,
          recent_xp: 0
        }
      }
      
      // For planned habits, we need to estimate based on frequency
      // Calculate planned habits based on habit frequency and creation date
      if (habitIds.length > 0) {
        console.log('📅 Calculating planned habits for', habitIds.length, 'habits')
        const habitCreationDates = habits.map((h: any) => new Date(h.created_at))
        const oldestHabitDate = new Date(Math.min(...habitCreationDates.map((d: Date) => d.getTime())))
        const daysSinceOldestHabit = Math.floor((now.getTime() - oldestHabitDate.getTime()) / (1000 * 60 * 60 * 24))
        
        console.log('📅 Oldest habit date:', oldestHabitDate.toISOString(), 'Days since:', daysSinceOldestHabit)
        console.log('📅 Current date:', now.toISOString())
        
        // Calculate planned habits based on frequency
        let totalPlannedHabits = 0
        let recentPlannedHabits = 0
        
        for (const habit of habits) {
          const habitCreatedAt = new Date(habit.created_at)
          const daysSinceCreation = Math.floor((now.getTime() - habitCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
          const daysSinceNinetyDaysAgo = Math.max(0, Math.min(daysSinceCreation, 90))
          
          console.log(`📅 Habit ${habit.id}:`, {
            created_at: habit.created_at,
            created_at_parsed: habitCreatedAt.toISOString(),
            frequency: habit.frequency,
            selected_days: habit.selected_days,
            daysSinceCreation,
            daysSinceNinetyDaysAgo
          })
          
          let plannedCount = 0
          let recentPlannedCount = 0
          
          switch (habit.frequency) {
            case 'daily':
              // For daily habits, count at least 1 if created today, otherwise count days
              plannedCount = Math.max(1, daysSinceCreation)
              recentPlannedCount = Math.max(1, daysSinceNinetyDaysAgo)
              break
            case 'weekly':
              // For weekly habits, count at least 1 if created within last 7 days, otherwise count weeks
              plannedCount = Math.max(1, Math.floor(daysSinceCreation / 7))
              recentPlannedCount = Math.max(1, Math.floor(daysSinceNinetyDaysAgo / 7))
              break
            case 'monthly':
              // For monthly habits, count at least 1 if created within last 30 days, otherwise count months
              plannedCount = Math.max(1, Math.floor(daysSinceCreation / 30))
              recentPlannedCount = Math.max(1, Math.floor(daysSinceNinetyDaysAgo / 30))
              break
            case 'custom':
              // For custom, count based on selected_days per week
              const selectedDaysCount = habit.selected_days?.length || 0
              // At least 1 if created today, otherwise calculate based on frequency
              plannedCount = Math.max(1, Math.floor((daysSinceCreation / 7) * selectedDaysCount))
              recentPlannedCount = Math.max(1, Math.floor((daysSinceNinetyDaysAgo / 7) * selectedDaysCount))
              break
          }
          
          console.log(`📅 Habit ${habit.id} calculation:`, {
            frequency: habit.frequency,
            daysSinceCreation,
            daysSinceNinetyDaysAgo,
            plannedCount,
            recentPlannedCount
          })
          
          totalPlannedHabits += Math.max(0, plannedCount)
          recentPlannedHabits += Math.max(0, recentPlannedCount)
        }
        
        // Ensure at least the number of habits is counted (minimum 1 per habit)
        totalPlannedHabits = Math.max(totalPlannedHabits, habitIds.length)
        recentPlannedHabits = Math.max(recentPlannedHabits, habitIds.length)
        
        console.log('📅 Total planned habits calculated:', {
          before_minimum: totalPlannedHabits,
          after_minimum: Math.max(totalPlannedHabits, habitIds.length),
          recent_before_minimum: recentPlannedHabits,
          recent_after_minimum: Math.max(recentPlannedHabits, habitIds.length),
          habitCount: habitIds.length
        })
        console.log('📅 Habit stats before update:', habitStats)
        
        // Use the calculated planned habits, but ensure it's at least the number of completions
        habitStats.total_planned = Math.max(
          parseInt(String(habitStats.total_planned || 0)),
          parseInt(String(habitStats.total_completed || 0)),
          totalPlannedHabits
        )
        habitStats.recent_planned = Math.max(
          parseInt(String(habitStats.recent_planned || 0)),
          parseInt(String(habitStats.recent_completed || 0)),
          recentPlannedHabits
        )
        
        console.log('📅 Habit stats after update:', {
          total_planned: habitStats.total_planned,
          recent_planned: habitStats.recent_planned,
          total_completed: habitStats.total_completed,
          recent_completed: habitStats.recent_completed
        })
      } else {
        // Fallback to old logic if no habits
        console.log('⏭️  No habits, skipping planned habits calculation')
        habitStats.total_planned = Math.max(parseInt(String(habitStats.total_planned || 0)), parseInt(String(habitStats.total_completed || 0)))
        habitStats.recent_planned = Math.max(parseInt(String(habitStats.recent_planned || 0)), parseInt(String(habitStats.recent_completed || 0)))
      }
    } else {
      console.log('⏭️  No habits, skipping habit stats calculation')
    }
    
    const totalCompleted = parseInt(String(stepStats.total_completed || 0)) + parseInt(String(habitStats.total_completed || 0))
    const totalPlanned = parseInt(String(stepStats.total_planned || 0)) + parseInt(String(habitStats.total_planned || 0))
    const recentCompleted = parseInt(String(stepStats.recent_completed || 0)) + parseInt(String(habitStats.recent_completed || 0))
    const recentPlanned = parseInt(String(stepStats.recent_planned || 0)) + parseInt(String(habitStats.recent_planned || 0))
    
    console.log('🔢 Final calculations:', {
      stepStats: {
        total_completed: parseInt(String(stepStats.total_completed || 0)),
        total_planned: parseInt(String(stepStats.total_planned || 0)),
        recent_completed: parseInt(String(stepStats.recent_completed || 0)),
        recent_planned: parseInt(String(stepStats.recent_planned || 0))
      },
      habitStats: {
        total_completed: parseInt(String(habitStats.total_completed || 0)),
        total_planned: parseInt(String(habitStats.total_planned || 0)),
        recent_completed: parseInt(String(habitStats.recent_completed || 0)),
        recent_planned: parseInt(String(habitStats.recent_planned || 0))
      },
      totals: {
        totalCompleted,
        totalPlanned,
        recentCompleted,
        recentPlanned
      }
    })
    
    const completionRateAllTime = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0
    const completionRateRecent = recentPlanned > 0 ? (recentCompleted / recentPlanned) * 100 : 0
    
    console.log('📈 Completion rates:', {
      completionRateAllTime,
      completionRateRecent
    })
    
    // Determine trend: positive if recent completion rate is higher than all-time
    let trend: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (completionRateRecent > completionRateAllTime + 5) {
      trend = 'positive'
    } else if (completionRateRecent < completionRateAllTime - 5) {
      trend = 'negative'
    }
    
    console.log('📊 Trend:', trend)
    
    const result = {
      aspiration_id: aspirationId,
      total_xp: parseInt(String(stepStats.total_xp || 0)) + parseInt(String(habitStats.total_xp || 0)),
      recent_xp: parseInt(String(stepStats.recent_xp || 0)) + parseInt(String(habitStats.recent_xp || 0)),
      total_completed_steps: parseInt(String(stepStats.total_completed || 0)),
      recent_completed_steps: parseInt(String(stepStats.recent_completed || 0)),
      total_completed_habits: parseInt(String(habitStats.total_completed || 0)),
      recent_completed_habits: parseInt(String(habitStats.recent_completed || 0)),
      total_planned_steps: parseInt(String(stepStats.total_planned || 0)),
      recent_planned_steps: parseInt(String(stepStats.recent_planned || 0)),
      total_planned_habits: parseInt(String(habitStats.total_planned || 0)),
      recent_planned_habits: parseInt(String(habitStats.recent_planned || 0)),
      completion_rate_all_time: completionRateAllTime,
      completion_rate_recent: completionRateRecent,
      trend
    }
    
    console.log('✅ Aspiration balance result:', result)
    console.log('=== getAspirationBalance END ===')
    return result
  } catch (error: any) {
    console.error('Error getting aspiration balance:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack
    })
    // Return empty balance instead of throwing
    return {
      aspiration_id: aspirationId,
      total_xp: 0,
      recent_xp: 0,
      total_completed_steps: 0,
      recent_completed_steps: 0,
      total_completed_habits: 0,
      recent_completed_habits: 0,
      total_planned_steps: 0,
      recent_planned_steps: 0,
      total_planned_habits: 0,
      recent_planned_habits: 0,
      completion_rate_all_time: 0,
      completion_rate_recent: 0,
      trend: 'neutral'
    }
  }
}

export async function getDailyStepsByUserId(userId: string, date?: Date): Promise<DailyStep[]> {
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
          is_important, is_urgent, step_type, custom_type_name, 
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
        FROM daily_steps 
        WHERE user_id = ${userId}
        AND date >= ${startOfDay}
        AND date <= ${endOfDay}
        ORDER BY 
          CASE WHEN completed THEN 1 ELSE 0 END,
          is_important DESC,
          is_urgent DESC,
          created_at ASC
      `
    } else {
      // Get all steps for user
      // Use TO_CHAR to return date as YYYY-MM-DD string to avoid timezone issues
      query = sql`
        SELECT 
          id, user_id, goal_id, title, description, completed, 
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          is_important, is_urgent, step_type, custom_type_name, 
          estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
        FROM daily_steps 
        WHERE user_id = ${userId}
        ORDER BY 
          CASE WHEN completed THEN 1 ELSE 0 END,
          date ASC,
          is_important DESC,
          is_urgent DESC,
          created_at DESC
      `
    }
    
    const steps = await query
    return steps as DailyStep[]
  } catch (error) {
    console.error('Error fetching daily steps:', error)
    return []
  }
}

// Alias for backward compatibility
export const getAllDailySteps = getDailyStepsByUserId

export async function calculateNextCustomStepDate(frequencyTime: string): Promise<Date> {
  // Simple implementation - returns tomorrow for now
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
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
  
  const goal = await sql`
    INSERT INTO goals (
      id, user_id, title, description, target_date, status, priority, 
      category, goal_type, progress_percentage, progress_type, 
      progress_target, progress_current, progress_unit, area_id, aspiration_id
    ) VALUES (
      ${id}, ${goalData.user_id}, ${goalData.title}, ${goalData.description || null}, 
      ${goalData.target_date || null}, ${goalData.status || 'active'}, 
      ${goalData.priority || 'meaningful'}, ${goalData.category || 'medium-term'}, 
      ${goalData.goal_type || 'outcome'}, ${goalData.progress_percentage || 0}, 
      ${goalData.progress_type || 'percentage'}, ${goalData.progress_target || null}, 
      ${goalData.progress_current || 0}, ${goalData.progress_unit || null},
      ${goalData.area_id || null}, ${goalData.aspiration_id || null}
    ) RETURNING *
  `
  return goal[0] as Goal
}

export async function createDailyStep(stepData: Omit<Partial<DailyStep>, 'date'> & { date?: Date | string }): Promise<DailyStep> {
  const id = crypto.randomUUID()
  
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
        // ISO string with time - extract date part
        dateValue = stepData.date.split('T')[0]
      }
    }
  }
  
  // Use TO_CHAR to return date as YYYY-MM-DD string
  const step = await sql`
    INSERT INTO daily_steps (
      id, user_id, goal_id, title, description, completed, date, 
      is_important, is_urgent, step_type, custom_type_name, 
      estimated_time, xp_reward, deadline
    ) VALUES (
      ${id}, ${stepData.user_id}, ${stepData.goal_id}, ${stepData.title}, 
      ${stepData.description || null}, ${stepData.completed || false}, 
      ${dateValue}, ${stepData.is_important || false}, 
      ${stepData.is_urgent || false}, ${stepData.step_type || 'custom'}, 
      ${stepData.custom_type_name || null}, ${stepData.estimated_time || 30},
      ${stepData.xp_reward || 1}, ${stepData.deadline || null}
    ) RETURNING 
      id, user_id, goal_id, title, description, completed, 
      TO_CHAR(date, 'YYYY-MM-DD') as date,
      is_important, is_urgent, step_type, custom_type_name, 
      estimated_time, xp_reward, deadline, completed_at, created_at, updated_at
  `
  return step[0] as DailyStep
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

    return updatedStep[0] as DailyStep
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
    
    return step
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
    
    return updatedStep[0] as DailyStep
  } catch (error) {
    console.error('Error updating daily step:', error)
    throw error
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
    if (stepData.step_type !== undefined) {
      await sql`UPDATE daily_steps SET step_type = ${stepData.step_type}, updated_at = NOW() WHERE id = ${stepId}`
    }
    if (stepData.custom_type_name !== undefined) {
      await sql`UPDATE daily_steps SET custom_type_name = ${stepData.custom_type_name}, updated_at = NOW() WHERE id = ${stepId}`
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
    
    // Get the updated step
    const updatedStep = await sql`SELECT * FROM daily_steps WHERE id = ${stepId}`
    
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

export async function getUpdatedGoalAfterStepCompletion(goalId: string): Promise<Goal> {
  try {
    const goal = await sql`
      SELECT * FROM goals WHERE id = ${goalId}
    `
    return goal[0] as Goal
  } catch (error) {
    console.error('Error fetching updated goal:', error)
    throw error
  }
}

export async function updateGoal(goalId: string, userId: string, goalData: Partial<Goal>): Promise<Goal> {
  try {
    console.log('DB: updateGoal called with:', { goalId, userId, goalData })
    
    // If status is being set to 'completed', check if all milestones are completed
    if (goalData.status === 'completed') {
      const milestones = await getGoalMilestonesByGoalId(goalId)
      if (milestones.length > 0) {
        const incompleteMilestones = milestones.filter(m => !m.completed)
        if (incompleteMilestones.length > 0) {
          throw new Error(`Cíl nelze označit jako splněný, dokud nejsou dokončeny všechny milníky. Zbývá ${incompleteMilestones.length} nedokončených milníků.`)
        }
      }
    }
    
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

    return row as Goal
  } catch (error) {
    console.error('Error updating goal:', error)
    throw error
  }
}

export async function updateGoalById(goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
  try {
    console.log('Updating goal with ID:', goalId, 'Updates:', updates)
    
    // If status is being set to 'completed', check if all milestones are completed
    if (updates.status === 'completed') {
      const milestones = await getGoalMilestonesByGoalId(goalId)
      if (milestones.length > 0) {
        const incompleteMilestones = milestones.filter(m => !m.completed)
        if (incompleteMilestones.length > 0) {
          throw new Error(`Cíl nelze označit jako splněný, dokud nejsou dokončeny všechny milníky. Zbývá ${incompleteMilestones.length} nedokončených milníků.`)
        }
      }
    }
    
    const result = await sql`
      UPDATE goals 
      SET 
        title = COALESCE(${updates.title}, title),
        description = COALESCE(${updates.description}, description),
        area_id = COALESCE(${updates.area_id}, area_id),
        aspiration_id = ${updates.aspiration_id !== undefined ? updates.aspiration_id : null},
        target_date = COALESCE(${updates.target_date}, target_date),
        status = COALESCE(${updates.status}, status),
        updated_at = NOW()
      WHERE id = ${goalId}
      RETURNING *
    `

    console.log('Update result:', result)
    
    if (result.length === 0) {
      console.log('No goal found for ID:', goalId)
      return null
    }
    
    // Get the updated goal with area name
    const goalWithArea = await sql`
      SELECT g.*, a.name as area_name
      FROM goals g
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.id = ${goalId}
    `
    
    return goalWithArea[0] as Goal
  } catch (error) {
    console.error('Error updating goal:', error)
    throw error
  }
}

export async function deleteGoalById(goalId: string): Promise<boolean> {
  try {
    console.log('Deleting goal with ID:', goalId)
    
    const result = await sql`
      DELETE FROM goals 
      WHERE id = ${goalId}
      RETURNING id
    `

    console.log('Delete result:', result)
    
    return result.length > 0
  } catch (error) {
    console.error('Error deleting goal:', error)
    throw error
  }
}

export async function updateGoalPriorities(priorities: Array<{id: string, priority: number}>): Promise<boolean> {
  try {
    console.log('Updating goal priorities:', priorities)
    
    // Update each goal's priority as string
    for (const { id, priority } of priorities) {
      console.log(`Updating goal ${id} with priority ${priority}`)
      await sql`
        UPDATE goals 
        SET priority = ${priority.toString()}, updated_at = NOW()
        WHERE id = ${id}
      `
    }
    
    console.log('Successfully updated goal priorities')
    return true
  } catch (error) {
    console.error('Error updating goal priorities:', error)
    console.error('Error details:', error)
    throw error
  }
}

export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  try {
    console.log(`🗑️ Deleting goal ${goalId} for user ${userId}`)
    
    // First check if goal exists
    const goalExists = await sql`
      SELECT id FROM goals 
      WHERE id = ${goalId} AND user_id = ${userId}
    `
    
    if (goalExists.length === 0) {
      throw new Error('Goal not found or access denied')
    }
    
    // Get all step IDs for this goal
    const steps = await sql`
      SELECT id FROM daily_steps 
      WHERE goal_id = ${goalId} AND user_id = ${userId}
    `
    
    const stepIds = steps.map(step => step.id)
    console.log(`📝 Found ${stepIds.length} steps to delete`)
    
    if (stepIds.length > 0) {
      // First get automation IDs before deleting them
      const automations = await sql`
        SELECT id FROM automations 
        WHERE target_id = ANY(${stepIds})
      `
      const automationIds = automations.map(automation => automation.id)
      console.log(`🤖 Found ${automationIds.length} automations to delete`)
      
      if (automationIds.length > 0) {
        // Delete related event interactions first
        console.log('🗑️ Deleting event interactions...')
        await sql`
          DELETE FROM event_interactions 
          WHERE automation_id = ANY(${automationIds})
        `
      }
      
      // Delete related metrics
      console.log('📊 Deleting metrics...')
      await sql`
        DELETE FROM metrics 
        WHERE step_id = ANY(${stepIds})
      `
      
      // Delete related automations
      console.log('🤖 Deleting automations...')
      await sql`
        DELETE FROM automations 
        WHERE target_id = ANY(${stepIds})
      `
    }
    
    // Delete events related to this goal
    console.log('⚡ Deleting events...')
    await sql`
      DELETE FROM events 
      WHERE goal_id = ${goalId} AND user_id = ${userId}
    `
    
    // Delete related steps
    console.log('👣 Deleting steps...')
    await sql`
      DELETE FROM daily_steps 
      WHERE goal_id = ${goalId} AND user_id = ${userId}
    `
    
    // Delete the goal
    console.log('🎯 Deleting goal...')
    const result = await sql`
      DELETE FROM goals 
      WHERE id = ${goalId} AND user_id = ${userId}
    `
    
    console.log('✅ Goal deleted successfully')
  } catch (error) {
    console.error('❌ Error deleting goal:', error)
    throw error
  }
}

export async function determineGoalCategoryWithSettings(targetDate: Date | null, shortTermDays: number = 90, longTermDays: number = 365): Promise<'short-term' | 'medium-term' | 'long-term'> {
  if (!targetDate) {
    return 'medium-term'
  }

  const today = new Date()
  const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff <= shortTermDays) {
    return 'short-term'
  } else if (daysDiff <= longTermDays) {
    return 'medium-term'
  } else {
    return 'long-term'
  }
}

export async function updateGoalProgressFromMetrics(goalId: string) {
  try {
    // Use a single query to calculate and update progress
    const result = await sql`
      WITH step_progress AS (
        SELECT 
          CASE 
            WHEN ds.metric_id IS NOT NULL AND m.target_value > 0 AND m.current_value IS NOT NULL THEN
              LEAST((m.current_value / m.target_value) * 100, 100)
            WHEN ds.completed THEN 100
            ELSE 0
          END as progress
        FROM daily_steps ds
        LEFT JOIN metrics m ON ds.metric_id = m.id
        WHERE ds.goal_id = ${goalId}
      )
      UPDATE goals 
      SET 
        progress_percentage = COALESCE(
          (SELECT ROUND(AVG(progress)) FROM step_progress), 
          0
        ),
        updated_at = NOW()
      WHERE id = ${goalId}
    `

    console.log(`Updated goal ${goalId} progress using optimized query`)
    return result
  } catch (error) {
    console.error('Error updating goal progress from metrics:', error)
    throw error
  }
}

export async function updateGoalProgress(goalId: string, progressPercentage: number): Promise<Goal> {
  try {
    const updatedGoal = await sql`
      UPDATE goals 
      SET progress_percentage = ${progressPercentage}, updated_at = NOW()
      WHERE id = ${goalId}
      RETURNING *
    `
    
    if (updatedGoal.length === 0) {
      throw new Error('Goal not found')
    }
    
    return updatedGoal[0] as Goal
  } catch (error) {
    console.error('Error updating goal progress:', error)
    throw error
  }
}

export async function updateGoalProgressCount(goalId: string, currentCount: number): Promise<Goal> {
  try {
    const updatedGoal = await sql`
      UPDATE goals 
      SET progress_current = ${currentCount}, 
          progress_percentage = CASE 
            WHEN progress_target > 0 THEN LEAST((${currentCount}::float / progress_target) * 100, 100)
            ELSE 0
          END,
          updated_at = NOW()
      WHERE id = ${goalId}
      RETURNING *
    `
    
    if (updatedGoal.length === 0) {
      throw new Error('Goal not found')
    }
    
    return updatedGoal[0] as Goal
  } catch (error) {
    console.error('Error updating goal progress count:', error)
    throw error
  }
}

export async function updateGoalProgressAmount(goalId: string, currentAmount: number): Promise<Goal> {
  try {
    const updatedGoal = await sql`
      UPDATE goals 
      SET progress_current = ${currentAmount}, 
          progress_percentage = CASE 
            WHEN progress_target > 0 THEN LEAST((${currentAmount}::float / progress_target) * 100, 100)
            ELSE 0
          END,
          updated_at = NOW()
      WHERE id = ${goalId}
      RETURNING *
    `
    
    if (updatedGoal.length === 0) {
      throw new Error('Goal not found')
    }
    
    return updatedGoal[0] as Goal
  } catch (error) {
    console.error('Error updating goal progress amount:', error)
    throw error
  }
}

export async function updateGoalProgressSteps(goalId: string): Promise<Goal> {
  try {
    // Calculate progress based on completed steps
    const result = await sql`
      WITH step_counts AS (
        SELECT 
          COUNT(*) as total_steps,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_steps
        FROM daily_steps 
        WHERE goal_id = ${goalId}
      )
      UPDATE goals 
      SET 
        progress_percentage = CASE 
          WHEN (SELECT total_steps FROM step_counts) > 0 THEN
            LEAST((SELECT completed_steps FROM step_counts)::float / (SELECT total_steps FROM step_counts) * 100, 100)
          ELSE 0
        END,
        updated_at = NOW()
      WHERE id = ${goalId}
      RETURNING *
    `
    
    if (result.length === 0) {
      throw new Error('Goal not found')
    }
    
    return result[0] as Goal
  } catch (error) {
    console.error('Error updating goal progress steps:', error)
    throw error
  }
}

// Category Settings functions
export async function getCategorySettings(userId: string): Promise<CategorySettings | null> {
  try {
    const result = await sql`
      SELECT * FROM category_settings 
      WHERE user_id = ${userId}
    `
    return result[0] as CategorySettings || null
  } catch (error) {
    console.error('Error getting category settings:', error)
    return null
  }
}

export async function createCategorySettings(
  userId: string, 
  shortTermDays: number = 90, 
  longTermDays: number = 365
): Promise<CategorySettings> {
  try {
    const id = crypto.randomUUID()
    const result = await sql`
      INSERT INTO category_settings (id, user_id, category, short_term_days, long_term_days)
      VALUES (${id}, ${userId}, 'short-term', ${shortTermDays}, ${longTermDays})
      RETURNING *
    `
    return result[0] as CategorySettings
  } catch (error) {
    console.error('Error creating category settings:', error)
    throw error
  }
}

export async function updateCategorySettings(
  userId: string, 
  shortTermDays: number, 
  longTermDays: number
): Promise<CategorySettings> {
  try {
    const result = await sql`
      UPDATE category_settings 
      SET short_term_days = ${shortTermDays}, 
          long_term_days = ${longTermDays}, 
          updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `
    return result[0] as CategorySettings
  } catch (error) {
    console.error('Error updating category settings:', error)
    throw error
  }
}

// Value functions
export async function getUserValues(userId: string): Promise<Value[]> {
  try {
    const result = await sql`
      SELECT * FROM values 
      WHERE user_id = ${userId}
      ORDER BY 
        is_custom ASC,
        level DESC,
        experience DESC,
        name ASC
    `
    return result as Value[]
  } catch (error) {
    console.error('Error getting user values:', error)
    return []
  }
}

export async function createUserValue(
  userId: string,
  name: string,
  description: string,
  color: string,
  icon: string,
  isCustom: boolean = true
): Promise<Value> {
  try {
    const id = crypto.randomUUID()
    const result = await sql`
      INSERT INTO values (id, user_id, name, description, color, icon, is_custom, level, experience)
      VALUES (${id}, ${userId}, ${name}, ${description}, ${color}, ${icon}, ${isCustom}, 1, 0)
      RETURNING *
    `
    return result[0] as Value
  } catch (error) {
    console.error('Error creating user value:', error)
    throw error
  }
}

export async function updateUserValue(
  valueId: string,
  userId: string,
  name: string,
  description: string,
  color: string,
  icon: string
): Promise<Value> {
  try {
    const result = await sql`
      UPDATE values 
      SET 
        name = ${name}, 
        description = ${description},
        color = ${color},
        icon = ${icon},
        updated_at = NOW()
      WHERE id = ${valueId} AND user_id = ${userId}
      RETURNING *
    `
    
    if (result.length === 0) {
      throw new Error('Value not found or access denied')
    }
    
    return result[0] as Value
  } catch (error) {
    console.error('Error updating user value:', error)
    throw error
  }
}

export async function deleteUserValue(valueId: string, userId: string): Promise<void> {
  try {
    const result = await sql`DELETE FROM values WHERE id = ${valueId} AND user_id = ${userId}`
    
    if (result.length === 0) {
      throw new Error('Value not found or access denied')
    }
  } catch (error) {
    console.error('Error deleting user value:', error)
    throw error
  }
}

export async function addExperienceToValue(valueId: string, userId: string, experiencePoints: number): Promise<Value> {
  try {
    const result = await sql`
      UPDATE values 
      SET 
        experience = experience + ${experiencePoints},
        level = CASE 
          WHEN experience + ${experiencePoints} >= 1000 THEN 5
          WHEN experience + ${experiencePoints} >= 750 THEN 4
          WHEN experience + ${experiencePoints} >= 500 THEN 3
          WHEN experience + ${experiencePoints} >= 250 THEN 2
          ELSE 1
        END,
        updated_at = NOW()
      WHERE id = ${valueId} AND user_id = ${userId}
      RETURNING *
    `
    
    if (result.length === 0) {
      throw new Error('Value not found or access denied')
    }
    
    return result[0] as Value
  } catch (error) {
    console.error('Error adding experience to value:', error)
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
    
    console.log('Update result:', result)
  } catch (error) {
    console.error('Error updating user onboarding status:', error)
    throw error
  }
}

// Goal Metrics functions
export async function createGoalMetric(metricData: Omit<GoalMetric, 'id' | 'created_at' | 'updated_at'>): Promise<GoalMetric> {
  try {
    const id = crypto.randomUUID()
    const metric = await sql`
      INSERT INTO goal_metrics (
        id, user_id, goal_id, name, description, type, unit, target_value, current_value
      ) VALUES (
        ${id}, ${metricData.user_id}, ${metricData.goal_id}, ${metricData.name}, 
        ${metricData.description || null}, ${metricData.type}, ${metricData.unit}, 
        ${metricData.target_value}, ${metricData.current_value}
      ) RETURNING *
    `
    return metric[0] as GoalMetric
  } catch (error) {
    console.error('Error creating goal metric:', error)
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
    return metrics as GoalMetric[]
  } catch (error) {
    console.error('Error fetching goal metrics:', error)
    return []
  }
}

export async function updateGoalMetric(metricId: string, updates: Partial<Omit<GoalMetric, 'id' | 'user_id' | 'goal_id' | 'created_at'>>): Promise<GoalMetric> {
  try {
    const metric = await sql`
      UPDATE goal_metrics 
      SET 
        name = COALESCE(${updates.name}, name),
        description = COALESCE(${updates.description}, description),
        type = COALESCE(${updates.type}, type),
        unit = COALESCE(${updates.unit}, unit),
        target_value = COALESCE(${updates.target_value}, target_value),
        current_value = COALESCE(${updates.current_value}, current_value),
        updated_at = NOW()
      WHERE id = ${metricId}
      RETURNING *
    `
    return metric[0] as GoalMetric
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

// Goal Milestones functions
export async function getGoalMilestonesByGoalId(goalId: string): Promise<GoalMilestone[]> {
  try {
    const milestones = await sql`
      SELECT * FROM goal_milestones 
      WHERE goal_id = ${goalId}
      ORDER BY "order" ASC, created_at ASC
    `
    return milestones as GoalMilestone[]
  } catch (error) {
    console.error('Error fetching goal milestones:', error)
    return []
  }
}

export async function createGoalMilestone(milestoneData: Omit<GoalMilestone, 'id' | 'created_at' | 'updated_at'>): Promise<GoalMilestone> {
  try {
    const id = crypto.randomUUID()
    const milestone = await sql`
      INSERT INTO goal_milestones (
        id, user_id, goal_id, title, description, completed, completed_at, "order"
      ) VALUES (
        ${id}, ${milestoneData.user_id}, ${milestoneData.goal_id}, ${milestoneData.title}, 
        ${milestoneData.description || null}, ${milestoneData.completed || false}, 
        ${milestoneData.completed_at || null}, ${milestoneData.order || 0}
      ) RETURNING *
    `
    return milestone[0] as GoalMilestone
  } catch (error) {
    console.error('Error creating goal milestone:', error)
    throw error
  }
}

export async function updateGoalMilestone(milestoneId: string, updates: Partial<Omit<GoalMilestone, 'id' | 'user_id' | 'goal_id' | 'created_at'>>): Promise<GoalMilestone> {
  try {
    // If completed is being set, handle completed_at accordingly
    let completedAtValue = null
    if (updates.completed !== undefined) {
      if (updates.completed) {
        completedAtValue = new Date()
      } else {
        completedAtValue = null
      }
    }
    
    const milestone = await sql`
      UPDATE goal_milestones 
      SET 
        title = COALESCE(${updates.title}, title),
        description = COALESCE(${updates.description}, description),
        completed = COALESCE(${updates.completed}, completed),
        completed_at = ${completedAtValue !== null ? completedAtValue : sql`completed_at`},
        "order" = COALESCE(${updates.order}, "order"),
        updated_at = NOW()
      WHERE id = ${milestoneId}
      RETURNING *
    `
    return milestone[0] as GoalMilestone
  } catch (error) {
    console.error('Error updating goal milestone:', error)
    throw error
  }
}

export async function deleteGoalMilestone(milestoneId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM goal_milestones 
      WHERE id = ${milestoneId}
    `
  } catch (error) {
    console.error('Error deleting goal milestone:', error)
    throw error
  }
}

export async function updateGoalProgressFromGoalMetrics(goalId: string) {
  try {
    // Calculate progress based on goal metrics
    const result = await sql`
      WITH metric_progress AS (
        SELECT 
          CASE 
            WHEN target_value > 0 AND current_value IS NOT NULL THEN
              LEAST((current_value / target_value) * 100, 100)
            ELSE 0
          END as progress
        FROM goal_metrics
        WHERE goal_id = ${goalId}
      )
      UPDATE goals 
      SET 
        progress_percentage = COALESCE(
          (SELECT ROUND(AVG(progress)) FROM metric_progress), 
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
    // Calculate progress based on new formula: 50% metrics + 50% steps
    const result = await sql`
      WITH metric_progress AS (
        SELECT 
          CASE 
            WHEN target_value > 0 AND current_value IS NOT NULL THEN
              LEAST((current_value / target_value) * 100, 100)
            ELSE 0
          END as progress
        FROM goal_metrics
        WHERE goal_id = ${goalId}
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
      combined_progress AS (
        SELECT 
          CASE 
            WHEN (SELECT COUNT(*) FROM goal_metrics WHERE goal_id = ${goalId}) > 0 
                 AND (SELECT COUNT(*) FROM daily_steps WHERE goal_id = ${goalId}) > 0 THEN
              -- Both metrics and steps exist: 50% metrics + 50% steps
              ((SELECT AVG(progress) FROM metric_progress) * 0.5) + 
              ((SELECT progress FROM step_progress) * 0.5)
            WHEN (SELECT COUNT(*) FROM goal_metrics WHERE goal_id = ${goalId}) > 0 THEN
              -- Only metrics exist: 100% metrics
              (SELECT AVG(progress) FROM metric_progress)
            WHEN (SELECT COUNT(*) FROM daily_steps WHERE goal_id = ${goalId}) > 0 THEN
              -- Only steps exist: 100% steps
              (SELECT progress FROM step_progress)
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
    `

    console.log(`Updated goal ${goalId} progress using combined formula (50% metrics + 50% steps)`)
    return result
  } catch (error) {
    console.error('Error updating goal progress with combined formula:', error)
    throw error
  }
}

// Event functions
export async function getEventsByUserId(userId: string): Promise<Event[]> {
  try {
    const events = await sql`
      SELECT * FROM events 
      WHERE user_id = ${userId}
      ORDER BY 
        CASE WHEN completed THEN 1 ELSE 0 END,
        date ASC,
        is_important DESC,
        is_urgent DESC,
        created_at DESC
    `
    return events as Event[]
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export async function createEvent(eventData: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
  try {
    const id = crypto.randomUUID()
    const event = await sql`
      INSERT INTO events (
        id, user_id, goal_id, automation_id, title, description, 
        completed, date, is_important, is_urgent, event_type,
        target_metric_id, target_step_id, update_value, update_unit
      ) VALUES (
        ${id}, ${eventData.user_id}, ${eventData.goal_id}, ${eventData.automation_id},
        ${eventData.title}, ${eventData.description || null}, ${eventData.completed},
        ${eventData.date}, ${eventData.is_important}, ${eventData.is_urgent},
        ${eventData.event_type}, ${eventData.target_metric_id || null},
        ${eventData.target_step_id || null}, ${eventData.update_value || null},
        ${eventData.update_unit || null}
      ) RETURNING *
    `
    return event[0] as Event
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

export async function updateEvent(eventId: string, userId: string, eventData: Partial<Event>): Promise<Event> {
  try {
    const updateFields = []
    const values = []
    
    if (eventData.title !== undefined) {
      updateFields.push('title = $' + (values.length + 1))
      values.push(eventData.title)
    }
    if (eventData.description !== undefined) {
      updateFields.push('description = $' + (values.length + 1))
      values.push(eventData.description)
    }
    if (eventData.completed !== undefined) {
      updateFields.push('completed = $' + (values.length + 1))
      values.push(eventData.completed)
    }
    if (eventData.completed_at !== undefined) {
      updateFields.push('completed_at = $' + (values.length + 1))
      values.push(eventData.completed_at)
    }
    if (eventData.date !== undefined) {
      updateFields.push('date = $' + (values.length + 1))
      values.push(eventData.date)
    }
    if (eventData.is_important !== undefined) {
      updateFields.push('is_important = $' + (values.length + 1))
      values.push(eventData.is_important)
    }
    if (eventData.is_urgent !== undefined) {
      updateFields.push('is_urgent = $' + (values.length + 1))
      values.push(eventData.is_urgent)
    }
    if (eventData.update_value !== undefined) {
      updateFields.push('update_value = $' + (values.length + 1))
      values.push(eventData.update_value)
    }
    if (eventData.update_unit !== undefined) {
      updateFields.push('update_unit = $' + (values.length + 1))
      values.push(eventData.update_unit)
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update')
    }
    
    const query = `
      UPDATE events 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `
    
    values.push(eventId, userId)
    
    const updatedEvent = await sql.unsafe(query) as unknown as any[]
    
    if (updatedEvent.length === 0) {
      throw new Error('Event not found or access denied')
    }
    
    return updatedEvent[0] as Event
  } catch (error) {
    console.error('Error updating event:', error)
    throw error
  }
}

export async function deleteEvent(eventId: string, userId: string): Promise<void> {
  try {
    const result = await sql`
      DELETE FROM events 
      WHERE id = ${eventId} AND user_id = ${userId}
    `
    
    if (result.length === 0) {
      throw new Error('Event not found or access denied')
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

// EventInteraction functions
export async function getEventInteractionsByUserId(userId: string): Promise<EventInteraction[]> {
  try {
    const interactions = await sql`
      SELECT * FROM event_interactions 
      WHERE user_id = ${userId}
      ORDER BY date DESC, created_at DESC
    `
    return interactions as EventInteraction[]
  } catch (error) {
    console.error('Error fetching event interactions:', error)
    return []
  }
}

export async function getEventInteractionsByDate(userId: string, date: Date): Promise<EventInteraction[]> {
  try {
    const dateStr = date.toISOString().split('T')[0]
    const interactions = await sql`
      SELECT * FROM event_interactions 
      WHERE user_id = ${userId} AND date = ${dateStr}
      ORDER BY created_at DESC
    `
    return interactions as EventInteraction[]
  } catch (error) {
    console.error('Error fetching event interactions by date:', error)
    return []
  }
}

export async function createEventInteraction(interactionData: Omit<EventInteraction, 'id' | 'created_at' | 'updated_at'>): Promise<EventInteraction> {
  try {
    const id = crypto.randomUUID()
    const interaction = await sql`
      INSERT INTO event_interactions (
        id, user_id, automation_id, date, status, 
        postponed_to, completed_at
      ) VALUES (
        ${id}, ${interactionData.user_id}, ${interactionData.automation_id},
        ${interactionData.date}, ${interactionData.status},
        ${interactionData.postponed_to || null}, ${interactionData.completed_at || null}
      ) RETURNING *
    `
    return interaction[0] as EventInteraction
  } catch (error) {
    console.error('Error creating event interaction:', error)
    throw error
  }
}

export async function updateEventInteraction(interactionId: string, userId: string, interactionData: Partial<EventInteraction>): Promise<EventInteraction> {
  try {
    // Build dynamic update query using template literals
    let updateFields = ['updated_at = NOW()']
    
    if (interactionData.status !== undefined) {
      updateFields.push(`status = '${interactionData.status}'`)
    }
    if (interactionData.postponed_to !== undefined) {
      updateFields.push(`postponed_to = '${interactionData.postponed_to.toISOString().split('T')[0]}'`)
    }
    if (interactionData.completed_at !== undefined) {
      updateFields.push(`completed_at = '${interactionData.completed_at.toISOString()}'`)
    }
    
    if (updateFields.length === 1) {
      throw new Error('No fields to update')
    }
    
    const updateClause = updateFields.join(', ')
    
    const updatedInteraction = await sql`
      UPDATE event_interactions 
      SET ${sql.unsafe(updateClause)}
      WHERE id = ${interactionId} AND user_id = ${userId}
      RETURNING *
    `
    
    if (updatedInteraction.length === 0) {
      throw new Error('Event interaction not found or access denied')
    }
    
    return updatedInteraction[0] as EventInteraction
  } catch (error) {
    console.error('Error updating event interaction:', error)
    throw error
  }
}

export async function deleteEventInteraction(interactionId: string, userId: string): Promise<void> {
  try {
    const result = await sql`
      DELETE FROM event_interactions 
      WHERE id = ${interactionId} AND user_id = ${userId}
    `
    
    if (result.length === 0) {
      throw new Error('Event interaction not found or access denied')
    }
  } catch (error) {
    console.error('Error deleting event interaction:', error)
    throw error
  }
}

export async function getActiveAutomations(userId: string): Promise<Automation[]> {
  try {
    const automations = await sql`
      SELECT * FROM automations 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY created_at DESC
    `
    return automations as Automation[]
  } catch (error) {
    console.error('Error fetching active automations:', error)
    return []
  }
}

export async function generateAutomatedSteps(userId: string): Promise<void> {
  try {
    console.log(`Generating automated steps for user ${userId}`)
    
    // Get active automations for the user
    const automations = await getActiveAutomations(userId)
    
    for (const automation of automations) {
      try {
        // Only process recurring automations
        if (automation.frequency_type !== 'recurring' || !automation.frequency_time) {
          continue
        }
        
        // Calculate next scheduled date based on frequency
        const nextDate = await calculateNextCustomStepDate(automation.frequency_time)
        
        // Get the goal for this automation
        const goal = await sql`
          SELECT id FROM goals WHERE id = ${automation.target_id}
        `
        
        if (goal.length === 0) {
          console.log(`Goal not found for automation ${automation.id}`)
          continue
        }
        
        // Check if a step already exists for this automation and date
        const existingStep = await sql`
          SELECT id FROM daily_steps 
          WHERE goal_id = ${automation.target_id}
          AND title = ${automation.name}
          AND date = ${nextDate.toISOString().split('T')[0]}
        `
        
        if (existingStep.length === 0) {
          // Create new automated step
          await createDailyStep({
            user_id: userId,
            goal_id: automation.target_id,
            title: automation.name,
            description: automation.description || '',
            date: nextDate,
            completed: false
          })
          
          console.log(`Created automated step: ${automation.name} for ${nextDate.toISOString().split('T')[0]}`)
        }
      } catch (error) {
        console.error(`Error generating step for automation ${automation.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error generating automated steps:', error)
    throw error
  }
}

// Notes functions
export async function createNote(noteData: Partial<Note>): Promise<Note> {
  const note = await sql`
    INSERT INTO notes (
      user_id, goal_id, title, content
    ) VALUES (
      ${noteData.user_id}, ${noteData.goal_id || null}, 
      ${noteData.title}, ${noteData.content}
    ) RETURNING *
  `
  return note[0] as Note
}

export async function getNotesByUser(userId: string): Promise<Note[]> {
  const notes = await sql`
    SELECT * FROM notes 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return notes as Note[]
}

export async function getNotesByGoal(goalId: string): Promise<Note[]> {
  const notes = await sql`
    SELECT * FROM notes 
    WHERE goal_id = ${goalId}
    ORDER BY created_at DESC
  `
  return notes as Note[]
}

export async function getStandaloneNotes(userId: string): Promise<Note[]> {
  const notes = await sql`
    SELECT * FROM notes 
    WHERE user_id = ${userId} AND goal_id IS NULL
    ORDER BY created_at DESC
  `
  return notes as Note[]
}

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
  const note = await sql`
    UPDATE notes 
    SET title = ${updates.title}, content = ${updates.content}, updated_at = NOW()
    WHERE id = ${noteId}
    RETURNING *
  `
  return note[0] as Note
}

export async function deleteNote(noteId: string): Promise<void> {
  await sql`
    DELETE FROM notes WHERE id = ${noteId}
  `
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
  filters?: UserSettings['filters']
): Promise<UserSettings> {
  try {
    // Get existing settings to preserve values not being updated
    const existingSettings = await getUserSettings(userId)
    
    const finalDailyStepsCount = dailyStepsCount ?? existingSettings?.daily_steps_count ?? 3
    const finalWorkflow = workflow ?? existingSettings?.workflow ?? 'daily_planning'
    const finalDailyResetHour = dailyResetHour ?? existingSettings?.daily_reset_hour ?? 0
    const finalFilters = filters ?? existingSettings?.filters ?? {
      showToday: true,
      showOverdue: true,
      showFuture: false,
      showWithGoal: true,
      showWithoutGoal: true,
      sortBy: 'date' as const
    }
    
    const settings = await sql`
      INSERT INTO user_settings (id, user_id, daily_steps_count, workflow, daily_reset_hour, filters)
      VALUES (${crypto.randomUUID()}, ${userId}, ${finalDailyStepsCount}, ${finalWorkflow}, ${finalDailyResetHour}, ${JSON.stringify(finalFilters)})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        daily_steps_count = ${finalDailyStepsCount},
        workflow = ${finalWorkflow},
        daily_reset_hour = ${finalDailyResetHour},
        filters = ${JSON.stringify(finalFilters)},
        updated_at = NOW()
      RETURNING *
    `
    return settings[0] as UserSettings
  } catch (error) {
    console.error('Error creating/updating user settings:', error)
    throw error
  }
}

// Daily Planning functions
export async function getDailyPlanning(userId: string, date: Date): Promise<DailyPlanning | null> {
  try {
    const planning = await sql`
      SELECT * FROM daily_planning 
      WHERE user_id = ${userId} AND date = ${date.toISOString().split('T')[0]}
    `
    return planning[0] as DailyPlanning || null
  } catch (error) {
    console.error('Error fetching daily planning:', error)
    return null
  }
}

export async function createOrUpdateDailyPlanning(userId: string, date: Date, plannedSteps: string[]): Promise<DailyPlanning> {
  try {
    const planning = await sql`
      INSERT INTO daily_planning (id, user_id, date, planned_steps)
      VALUES (${crypto.randomUUID()}, ${userId}, ${date.toISOString().split('T')[0]}, ${plannedSteps})
      ON CONFLICT (user_id, date) 
      DO UPDATE SET 
        planned_steps = ${plannedSteps},
        updated_at = NOW()
      RETURNING *
    `
    return planning[0] as DailyPlanning
  } catch (error) {
    console.error('Error creating/updating daily planning:', error)
    throw error
  }
}

export async function markStepAsCompleted(userId: string, date: Date, stepId: string): Promise<DailyPlanning> {
  try {
    // First get current planning
    const currentPlanning = await getDailyPlanning(userId, date)
    if (!currentPlanning) {
      throw new Error('Daily planning not found')
    }

    // Remove step from planned_steps and add to completed_steps
    const plannedSteps = currentPlanning.planned_steps.filter(id => id !== stepId)
    const completedSteps = currentPlanning.completed_steps.includes(stepId) 
      ? currentPlanning.completed_steps 
      : [...currentPlanning.completed_steps, stepId]

    const planning = await sql`
      UPDATE daily_planning 
      SET planned_steps = ${plannedSteps}, completed_steps = ${completedSteps}, updated_at = NOW()
      WHERE user_id = ${userId} AND date = ${date.toISOString().split('T')[0]}
      RETURNING *
    `
    return planning[0] as DailyPlanning
  } catch (error) {
    console.error('Error marking step as completed:', error)
    throw error
  }
}

// User Streak functions
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  try {
    const streak = await sql`
      SELECT * FROM user_streak 
      WHERE user_id = ${userId}
    `
    return streak[0] as UserStreak || null
  } catch (error) {
    console.error('Error fetching user streak:', error)
    return null
  }
}

export async function createOrUpdateUserStreak(userId: string, currentStreak: number, longestStreak: number, lastActivityDate: Date): Promise<UserStreak> {
  try {
    const streak = await sql`
      INSERT INTO user_streak (id, user_id, current_streak, longest_streak, last_activity_date)
      VALUES (${crypto.randomUUID()}, ${userId}, ${currentStreak}, ${longestStreak}, ${lastActivityDate.toISOString().split('T')[0]})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        current_streak = ${currentStreak},
        longest_streak = ${longestStreak},
        last_activity_date = ${lastActivityDate.toISOString().split('T')[0]},
        updated_at = NOW()
      RETURNING *
    `
    return streak[0] as UserStreak
  } catch (error) {
    console.error('Error creating/updating user streak:', error)
    throw error
  }
}

export async function updateUserStreak(userId: string): Promise<UserStreak> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get current streak
    const currentStreak = await getUserStreak(userId)
    
    if (!currentStreak) {
      // Create new streak
      return await createOrUpdateUserStreak(userId, 1, 1, today)
    }
    
    const lastActivity = new Date(currentStreak.last_activity_date)
    lastActivity.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    
    let newCurrentStreak = currentStreak.current_streak
    let newLongestStreak = currentStreak.longest_streak
    
    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newCurrentStreak = currentStreak.current_streak + 1
      newLongestStreak = Math.max(newCurrentStreak, currentStreak.longest_streak)
    } else if (daysDiff > 1) {
      // Gap in days - reset streak
      newCurrentStreak = 1
    }
    // If daysDiff === 0, it's the same day, keep current streak
    
    return await createOrUpdateUserStreak(userId, newCurrentStreak, newLongestStreak, today)
  } catch (error) {
    console.error('Error updating user streak:', error)
    throw error
  }
}

// Statistics functions
export async function getUserStepStatistics(userId: string): Promise<{ completed: number, total: number }> {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN completed = true THEN 1 END) as completed
      FROM daily_steps 
      WHERE user_id = ${userId}
    `
    return {
      completed: parseInt(stats[0].completed) || 0,
      total: parseInt(stats[0].total) || 0
    }
  } catch (error) {
    console.error('Error fetching user step statistics:', error)
    return { completed: 0, total: 0 }
  }
}

// Daily Statistics functions
export async function createOrUpdateDailyStats(
  userId: string, 
  date: Date, 
  plannedStepsCount: number, 
  completedStepsCount: number, 
  totalStepsCount: number,
  optimumDeviation: number
): Promise<DailyStats> {
  try {
    const stats = await sql`
      INSERT INTO daily_stats (id, user_id, date, planned_steps_count, completed_steps_count, total_steps_count, optimum_deviation)
      VALUES (${crypto.randomUUID()}, ${userId}, ${date.toISOString().split('T')[0]}, ${plannedStepsCount}, ${completedStepsCount}, ${totalStepsCount}, ${optimumDeviation})
      ON CONFLICT (user_id, date) 
      DO UPDATE SET 
        planned_steps_count = daily_stats.planned_steps_count + ${plannedStepsCount},
        completed_steps_count = daily_stats.completed_steps_count + ${completedStepsCount},
        total_steps_count = daily_stats.total_steps_count + ${totalStepsCount},
        optimum_deviation = ${optimumDeviation},
        updated_at = NOW()
      RETURNING *
    `
    return stats[0] as DailyStats
  } catch (error) {
    console.error('Error creating/updating daily stats:', error)
    throw error
  }
}

export async function getDailyStats(userId: string, date: Date): Promise<DailyStats | null> {
  try {
    const stats = await sql`
      SELECT * FROM daily_stats 
      WHERE user_id = ${userId} AND date = ${date.toISOString().split('T')[0]}
    `
    return stats[0] as DailyStats || null
  } catch (error) {
    console.error('Error fetching daily stats:', error)
    return null
  }
}

export async function getUserDailyStats(userId: string, days: number = 30): Promise<DailyStats[]> {
  try {
    const stats = await sql`
      SELECT * FROM daily_stats 
      WHERE user_id = ${userId} 
      ORDER BY date DESC 
      LIMIT ${days}
    `
    return stats as DailyStats[]
  } catch (error) {
    console.error('Error fetching user daily stats:', error)
    return []
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
    const area = await sql`
      INSERT INTO areas (id, user_id, name, description, color, icon, "order")
      VALUES (${crypto.randomUUID()}, ${userId}, ${name}, ${description || null}, ${color}, ${icon || null}, ${order})
      RETURNING *
    `
    return area[0] as Area
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
    return areas as Area[]
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
    const setParts = []
    const values = []
    
    if (updates.name !== undefined) {
      setParts.push(`name = $${setParts.length + 1}`)
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      setParts.push(`description = $${setParts.length + 1}`)
      values.push(updates.description)
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
    return area[0] as Area
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
    console.log('Creating habit with ID:', id, 'Data:', habitData)
    
    const result = await sql`
      INSERT INTO habits (
        id, user_id, name, description, frequency, streak, 
        max_streak, category, difficulty, is_custom, reminder_time, selected_days, always_show, xp_reward, aspiration_id
      ) VALUES (
        ${id}, ${habitData.user_id}, ${habitData.name}, ${habitData.description}, 
        ${habitData.frequency}, ${habitData.streak}, ${habitData.max_streak}, 
        ${habitData.category}, ${habitData.difficulty}, ${habitData.is_custom}, ${habitData.reminder_time}, ${habitData.selected_days}, ${habitData.always_show}, ${habitData.xp_reward}, ${habitData.aspiration_id || null}
      ) RETURNING *
    `
    
    console.log('Create habit result:', result)
    
    if (result.length === 0) {
      console.log('No habit created')
      return null
    }
    
    return result[0] as Habit
  } catch (error) {
    console.error('Error creating habit:', error)
    return null
  }
}

export async function updateHabit(habitId: string, updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Habit | null> {
  try {
    console.log('Updating habit with ID:', habitId, 'Updates:', updates)
    
    const result = await sql`
      UPDATE habits 
      SET 
        name = COALESCE(${updates.name}, name),
        description = COALESCE(${updates.description}, description),
        frequency = COALESCE(${updates.frequency}, frequency),
        category = COALESCE(${updates.category}, category),
        difficulty = COALESCE(${updates.difficulty}, difficulty),
        reminder_time = COALESCE(${updates.reminder_time}, reminder_time),
        selected_days = COALESCE(${updates.selected_days}, selected_days),
        always_show = COALESCE(${updates.always_show}, always_show),
        xp_reward = COALESCE(${updates.xp_reward}, xp_reward),
        aspiration_id = ${updates.aspiration_id !== undefined ? updates.aspiration_id : null},
        updated_at = NOW()
      WHERE id = ${habitId}
      RETURNING *
    `
    
    console.log('Update result:', result)
    
    if (result.length === 0) {
      console.log('No habit found with ID:', habitId)
      return null
    }
    
    return result[0] as Habit
  } catch (error) {
    console.error('Error updating habit:', error)
    return null
  }
}

export async function getHabitsByUserId(userId: string): Promise<Habit[]> {
  try {
    const result = await sql`
      SELECT h.*, 
             COALESCE(
               json_object_agg(
                 hc.completion_date, 
                 hc.completed
               ) FILTER (WHERE hc.completion_date IS NOT NULL),
               '{}'::json
             ) as habit_completions
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = ${userId}
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `
    
    console.log('Debug - getHabitsByUserId result:', result)
    const studenaSprcha = result.find((h: any) => h.name === 'Studená sprcha')
    if (studenaSprcha) {
      console.log('Debug - Studená sprcha from DB:', studenaSprcha)
      console.log('Debug - Studená sprcha habit_completions from DB:', studenaSprcha.habit_completions)
    }
    
    return result.map((habit: any) => ({
      ...habit,
      habit_completions: habit.habit_completions || {}
    })) as Habit[]
  } catch (error) {
    console.error('Error fetching habits by user ID:', error)
    return []
  }
}


export async function deleteHabit(habitId: string): Promise<boolean> {
  try {
    await sql`DELETE FROM habits WHERE id = ${habitId}`
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
      
      return { completed: true, streak: newStreak }
    }
  } catch (error) {
    console.error('Error toggling habit completion:', error)
    throw error
  }
}