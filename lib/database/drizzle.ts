/**
 * Drizzle ORM Database Instance
 * For use with NextAuth.js Drizzle Adapter
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './auth-schema';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
  // Only connect when actually needed
  allowExitOnIdle: true,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err.message);
  // Don't exit process - let the app continue
});

// Create Drizzle instance with auth schema
export const db = drizzle(pool, {
  schema: authSchema,
});

// Export pool for raw queries if needed
export { pool };

// Type of db instance
export type Database = typeof db;
