import { config } from "dotenv";
import { resolve } from "path";
import { query } from "@/lib/database/db";
import { closePool } from "@/lib/database/db";

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function testCurrentStage() {
  try {
    console.log("Testing current_stage column...");

    // Check if column exists
    const checkResult = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'internal_requests' 
      AND column_name = 'current_stage'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ Column current_stage exists in internal_requests");
    } else {
      console.log("❌ Column current_stage does NOT exist in internal_requests");
    }

    // Test insert and update
    const testId = "test-" + Date.now();
    console.log("\nTesting insert with current_stage...");
    
    await query(`
      INSERT INTO internal_requests 
      (id, requester, department, request_type, description, current_stage) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [testId, "Test User", "finance", "balance", "Test request", "checking"]);

    console.log("✅ Insert successful");

    console.log("\nTesting update of current_stage...");
    
    const updateResult = await query(`
      UPDATE internal_requests 
      SET current_stage = $1 
      WHERE id = $2 
      RETURNING *
    `, ["recovering", testId]);

    console.log("✅ Update successful:", updateResult.rows[0]);

    // Clean up
    await query("DELETE FROM internal_requests WHERE id = $1", [testId]);
    console.log("\n✅ Cleanup successful");

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testCurrentStage();

