/**
 * Migration script: Add focus_status and focus_order fields to goals table
 * 
 * Usage: node scripts/migrate-add-focus-fields.js
 * 
 * This script adds two new columns to the goals table:
 * - focus_status: VARCHAR(20) - 'active_focus' | 'deferred' | NULL
 * - focus_order: INTEGER - order within active focus goals
 */

const { neon } = require('@neondatabase/serverless')

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log('🚀 Starting migration: Add focus fields to goals table...')
  
  try {
    // Step 1: Add focus_status column
    console.log('📝 Adding focus_status column...')
    await sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS focus_status VARCHAR(20) DEFAULT NULL
    `
    console.log('✅ focus_status column added')
    
    // Step 2: Add focus_order column
    console.log('📝 Adding focus_order column...')
    await sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS focus_order INTEGER DEFAULT NULL
    `
    console.log('✅ focus_order column added')
    
    // Step 3: Add check constraint for focus_status
    console.log('📝 Adding check constraint for focus_status...')
    try {
      await sql`
        ALTER TABLE goals
        ADD CONSTRAINT check_focus_status 
        CHECK (focus_status IN ('active_focus', 'deferred') OR focus_status IS NULL)
      `
      console.log('✅ Check constraint added')
    } catch (error) {
      // Constraint might already exist
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Check constraint already exists, skipping...')
      } else {
        throw error
      }
    }
    
    // Step 4: Create index for better query performance
    console.log('📝 Creating index on focus_status...')
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_goals_focus_status 
        ON goals(focus_status) 
        WHERE focus_status IS NOT NULL
      `
      console.log('✅ Index created')
    } catch (error) {
      console.log('ℹ️  Index might already exist, continuing...')
    }
    
    // Step 5: Create index for focus_order
    console.log('📝 Creating index on focus_order...')
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_goals_focus_order 
        ON goals(focus_order) 
        WHERE focus_order IS NOT NULL
      `
      console.log('✅ Index created')
    } catch (error) {
      console.log('ℹ️  Index might already exist, continuing...')
    }
    
    // Step 6: Verify migration
    console.log('🔍 Verifying migration...')
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'goals' 
      AND column_name IN ('focus_status', 'focus_order')
    `
    
    if (result.length === 2) {
      console.log('✅ Migration verified successfully!')
      console.log('📊 Columns added:')
      result.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    } else {
      console.warn('⚠️  Warning: Expected 2 columns, found', result.length)
    }
    
    console.log('\n✨ Migration completed successfully!')
    console.log('\n📌 Next steps:')
    console.log('   1. Update TypeScript interfaces in lib/cesta-db.ts')
    console.log('   2. Update API endpoints to handle focus fields')
    console.log('   3. Create Focus Management UI components')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.error('\n💡 Rollback:')
    console.error('   If you need to rollback, run:')
    console.error('   ALTER TABLE goals DROP COLUMN IF EXISTS focus_status;')
    console.error('   ALTER TABLE goals DROP COLUMN IF EXISTS focus_order;')
    process.exit(1)
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })

