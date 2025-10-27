import { query } from "../lib/database/db";

async function applyMigration() {
  try {
    console.log("Applying migration: add_current_stage column to internal_requests");

    // Check if column exists
    const checkResult = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'internal_requests' 
      AND column_name = 'current_stage'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ Column current_stage already exists in internal_requests");
      return;
    }

    // Add column
    await query(`
      ALTER TABLE internal_requests 
      ADD COLUMN current_stage VARCHAR(50)
    `);

    // Add index
    await query(`
      CREATE INDEX IF NOT EXISTS idx_internal_requests_stage 
      ON internal_requests(current_stage)
    `);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error applying migration:", error);
    throw error;
  }
}

applyMigration()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });

