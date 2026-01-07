/**
 * Script to add database indexes for assistant search optimization
 * Run with: node scripts/add-assistant-search-indexes.js
 * 
 * Requires DATABASE_URL environment variable
 * You can run it with: DATABASE_URL=your_url node scripts/add-assistant-search-indexes.js
 */

require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.error('Please set DATABASE_URL or run with: DATABASE_URL=your_url node scripts/add-assistant-search-indexes.js')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function addSearchIndexes() {
  try {
    console.log('Adding search indexes for assistant...')

    // Indexes for daily_steps (title and description search)
    await sql`
      CREATE INDEX IF NOT EXISTS idx_daily_steps_user_title_search 
      ON daily_steps(user_id, title text_pattern_ops)
    `
    console.log('✓ Created index: idx_daily_steps_user_title_search')

    await sql`
      CREATE INDEX IF NOT EXISTS idx_daily_steps_user_description_search 
      ON daily_steps(user_id, description text_pattern_ops)
    `
    console.log('✓ Created index: idx_daily_steps_user_description_search')

    // Indexes for goals (title and description search)
    await sql`
      CREATE INDEX IF NOT EXISTS idx_goals_user_title_search 
      ON goals(user_id, title text_pattern_ops)
    `
    console.log('✓ Created index: idx_goals_user_title_search')

    await sql`
      CREATE INDEX IF NOT EXISTS idx_goals_user_description_search 
      ON goals(user_id, description text_pattern_ops)
    `
    console.log('✓ Created index: idx_goals_user_description_search')

    // Indexes for areas (name and description search)
    await sql`
      CREATE INDEX IF NOT EXISTS idx_areas_user_name_search 
      ON areas(user_id, name text_pattern_ops)
    `
    console.log('✓ Created index: idx_areas_user_name_search')

    await sql`
      CREATE INDEX IF NOT EXISTS idx_areas_user_description_search 
      ON areas(user_id, description text_pattern_ops)
    `
    console.log('✓ Created index: idx_areas_user_description_search')

    // Indexes for habits (name and description search)
    await sql`
      CREATE INDEX IF NOT EXISTS idx_habits_user_name_search 
      ON habits(user_id, name text_pattern_ops)
    `
    console.log('✓ Created index: idx_habits_user_name_search')

    await sql`
      CREATE INDEX IF NOT EXISTS idx_habits_user_description_search 
      ON habits(user_id, description text_pattern_ops)
    `
    console.log('✓ Created index: idx_habits_user_description_search')

    console.log('\n✅ All search indexes created successfully!')
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
    process.exit(1)
  }
}

addSearchIndexes()

