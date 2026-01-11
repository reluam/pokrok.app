import { Pool } from 'pg'

// Create a connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please add it to your .env.local file.')
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Neon requires SSL for all connections
      ssl: { rejectUnauthorized: false },
    })

    // Test connection
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }
  
  return pool
}

export { getPool }
