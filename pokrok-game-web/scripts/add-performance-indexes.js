/**
 * Script to add performance indexes to the database
 * Run with: node scripts/add-performance-indexes.js
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function addPerformanceIndexes() {
  try {
    console.log('Adding performance indexes...')

    // Indexy pro habit_completions
    console.log('Creating indexes for habit_completions...')
    await sql`CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_habit_completions_user_habit_date ON habit_completions(user_id, habit_id, completion_date)`
    console.log('✓ habit_completions indexes created')

    // Indexy pro habits
    console.log('Creating indexes for habits...')
    await sql`CREATE INDEX IF NOT EXISTS idx_habits_user_id_created ON habits(user_id, created_at DESC)`
    console.log('✓ habits indexes created')

    // Indexy pro daily_steps
    console.log('Creating indexes for daily_steps...')
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date ON daily_steps(user_id, date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_goal_date ON daily_steps(user_id, goal_id, date) WHERE goal_id IS NOT NULL`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_area_date ON daily_steps(user_id, area_id, date) WHERE area_id IS NOT NULL`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_steps_user_completed ON daily_steps(user_id, completed, date)`
    console.log('✓ daily_steps indexes created')

    // Indexy pro goals
    console.log('Creating indexes for goals...')
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_status_created ON goals(user_id, status, created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_area ON goals(user_id, area_id) WHERE area_id IS NOT NULL`
    console.log('✓ goals indexes created')

    // Indexy pro areas
    console.log('Creating indexes for areas...')
    await sql`CREATE INDEX IF NOT EXISTS idx_areas_user_order ON areas(user_id, "order")`
    console.log('✓ areas indexes created')

    console.log('\n✅ All performance indexes created successfully!')
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
    process.exit(1)
  }
}

addPerformanceIndexes()

