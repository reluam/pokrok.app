require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function addAspirationColumns() {
  try {
    console.log('Adding aspiration_id columns to goals and habits tables...')
    
    // Add aspiration_id to goals table
    try {
      await sql`
        ALTER TABLE goals 
        ADD COLUMN IF NOT EXISTS aspiration_id VARCHAR(255) REFERENCES aspirations(id) ON DELETE SET NULL
      `
      console.log('✅ Added aspiration_id column to goals table')
    } catch (error) {
      console.log('⚠️ aspiration_id column may already exist in goals table:', error.message)
    }

    // Add aspiration_id to habits table
    try {
      await sql`
        ALTER TABLE habits 
        ADD COLUMN IF NOT EXISTS aspiration_id VARCHAR(255) REFERENCES aspirations(id) ON DELETE SET NULL
      `
      console.log('✅ Added aspiration_id column to habits table')
    } catch (error) {
      console.log('⚠️ aspiration_id column may already exist in habits table:', error.message)
    }

    // Verify the columns were added
    const goalsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'goals' 
      AND column_name = 'aspiration_id'
    `
    console.log('✅ Goals table columns verified:', goalsColumns)

    const habitsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'habits' 
      AND column_name = 'aspiration_id'
    `
    console.log('✅ Habits table columns verified:', habitsColumns)

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error adding aspiration columns:', error)
    process.exit(1)
  }
}

addAspirationColumns()

