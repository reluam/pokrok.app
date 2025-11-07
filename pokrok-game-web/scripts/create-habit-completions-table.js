require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless');

async function main() {
    const sql = neon(process.env.DATABASE_URL);

    console.log('Creating habit_completions table...');

    try {
        // Create habit_completions table
        await sql`
            CREATE TABLE IF NOT EXISTS habit_completions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                habit_id VARCHAR(255) NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
                completion_date DATE NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, habit_id, completion_date)
            )
        `;
        console.log('✅ habit_completions table created successfully.');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

main();

