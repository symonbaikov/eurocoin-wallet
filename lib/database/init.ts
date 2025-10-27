import { query } from "./db";
import fs from "fs";
import path from "path";

export async function initializeDatabase() {
  try {
    console.log("Initializing database schema...");

    // Read schema file
    const schemaPath = path.join(process.cwd(), "lib/database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Execute schema
    await query(schema);

    // Apply migrations
    await applyMigrations();

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
    throw error;
  }
}

async function applyMigrations() {
  try {
    console.log("Applying database migrations...");

    // Migration: Add current_stage column
    const checkResult = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'internal_requests' 
      AND column_name = 'current_stage'
    `);

    if (checkResult.rows.length === 0) {
      console.log("Applying migration: add_current_stage column");
      
      await query(`
        ALTER TABLE internal_requests 
        ADD COLUMN current_stage VARCHAR(50)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_internal_requests_stage 
        ON internal_requests(current_stage)
      `);

      console.log("✅ Migration completed: current_stage column added");
    } else {
      console.log("✅ Migration already applied: current_stage column exists");
    }
  } catch (error) {
    console.error("Failed to apply migrations:", error);
    throw error;
  }
}

export async function dropDatabase() {
  try {
    console.log("Dropping database tables...");

    // Drop triggers and function
    await query(`
      DROP TRIGGER IF EXISTS update_exchange_requests_updated_at ON exchange_requests;
      DROP TRIGGER IF EXISTS update_internal_requests_updated_at ON internal_requests;
      DROP FUNCTION IF EXISTS update_updated_at_column();
    `);

    // Drop tables
    await query("DROP TABLE IF EXISTS exchange_requests CASCADE");
    await query("DROP TABLE IF EXISTS internal_requests CASCADE");

    console.log("Database tables dropped successfully");
  } catch (error) {
    console.error("Failed to drop database tables:", error);
    throw error;
  }
}
