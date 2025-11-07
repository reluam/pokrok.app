require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless');

async function main() {
    const sql = neon(process.env.DATABASE_URL);

    console.log('Creating aspirations table...');

    try {
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
        `;
        console.log('✅ Aspirations table created successfully.');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

main();

