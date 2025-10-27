const { Client } = require('pg');

async function checkAndApplyMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'web_wallet',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if current_stage column exists
    const checkResult = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'internal_requests' 
      AND column_name = 'current_stage'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column current_stage already exists in internal_requests');
    } else {
      console.log('❌ Column current_stage does NOT exist. Applying migration...');
      
      // Add column
      await client.query(`
        ALTER TABLE internal_requests 
        ADD COLUMN current_stage VARCHAR(50)
      `);
      console.log('✅ Added column current_stage');

      // Add index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_internal_requests_stage 
        ON internal_requests(current_stage)
      `);
      console.log('✅ Added index on current_stage');

      console.log('✅ Migration completed successfully!');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndApplyMigration();

