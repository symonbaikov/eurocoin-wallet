import { config } from "dotenv";
import { resolve } from "path";
import { query } from "@/lib/database/db";
import { closePool } from "@/lib/database/db";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function applyNewsletterSchema() {
  try {
    console.log("Checking newsletter tables...");

    // Check if newsletter_subscribers table exists
    const checkResult = await query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'newsletter_subscribers'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ Newsletter tables already exist");
      return;
    }

    console.log("Applying newsletter schema migration...");

    // Read and apply migration
    const migrationPath = path.join(
      process.cwd(),
      "lib/database/migrations/add-newsletter-tables.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    await query(migrationSQL);

    console.log("✅ Newsletter schema applied successfully!");
    console.log("Created tables:");
    console.log("  - newsletter_subscribers");
    console.log("  - newsletter_campaigns");
    console.log("  - newsletter_logs");
  } catch (error) {
    console.error("❌ Failed to apply newsletter schema:", error);
    throw error;
  } finally {
    await closePool();
  }
}

applyNewsletterSchema().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
