require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function removeStepTypeColumns() {
  try {
    console.log('Removing step_type and custom_type_name columns from daily_steps table...')
    
    // Remove custom_type_name column first (it might have dependencies)
    try {
      await sql`
        ALTER TABLE daily_steps 
        DROP COLUMN IF EXISTS custom_type_name
      `
      console.log('✅ Removed custom_type_name column from daily_steps table')
    } catch (error) {
      console.log('⚠️ Error removing custom_type_name column:', error.message)
    }

    // Remove step_type column
    try {
      await sql`
        ALTER TABLE daily_steps 
        DROP COLUMN IF EXISTS step_type
      `
      console.log('✅ Removed step_type column from daily_steps table')
    } catch (error) {
      console.log('⚠️ Error removing step_type column:', error.message)
    }

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error during migration:', error)
    process.exit(1)
  }
}

removeStepTypeColumns()

