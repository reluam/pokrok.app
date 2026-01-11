import { Pool } from 'pg'

// Create a connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      const error = 'DATABASE_URL environment variable is not set. Please add it to your environment variables.'
      console.error(error)
      throw new Error(error)
    }
    
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Neon requires SSL for all connections
        ssl: { rejectUnauthorized: false },
        // Connection pool settings
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })

      // Test connection
      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err)
      })
    } catch (error: any) {
      console.error('Error creating database pool:', error)
      throw new Error(`Failed to create database connection: ${error.message}`)
    }
  }
  
  return pool
}

export { getPool }
