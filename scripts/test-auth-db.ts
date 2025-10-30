/**
 * Test NextAuth Database Connection and Schema
 * Verifies that all auth tables exist and are accessible
 *
 * Run: npx tsx scripts/test-auth-db.ts
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const REQUIRED_TABLES = [
  'auth_users',
  'auth_accounts',
  'auth_sessions',
  'auth_verification_tokens',
  'auth_authenticators',
];

const REQUIRED_FUNCTIONS = [
  'update_auth_users_updated_at',
  'cleanup_expired_auth_sessions',
  'cleanup_expired_verification_tokens',
];

async function testDatabase() {
  console.log('🔍 Testing NextAuth database setup...\n');

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    try {
      // Test 1: Check if all tables exist
      console.log('📊 Test 1: Checking tables...');
      const tablesResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name;
      `, [REQUIRED_TABLES]);

      const existingTables = tablesResult.rows.map((row) => row.table_name);
      const missingTables = REQUIRED_TABLES.filter((t) => !existingTables.includes(t));

      if (missingTables.length > 0) {
        console.error('❌ Missing tables:', missingTables.join(', '));
        console.log('\n💡 Run migration first: npx tsx scripts/apply-auth-migration.ts');
        process.exit(1);
      }

      console.log('✅ All tables exist:');
      existingTables.forEach((table) => {
        console.log(`   ✓ ${table}`);
      });

      // Test 2: Check table structures
      console.log('\n📋 Test 2: Checking table structures...');

      // Check auth_users columns
      const usersColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'auth_users'
        ORDER BY ordinal_position;
      `);

      console.log('✅ auth_users columns:');
      usersColumns.rows.forEach((col) => {
        console.log(`   ✓ ${col.column_name} (${col.data_type})`);
      });

      // Test 3: Check indexes
      console.log('\n🔍 Test 3: Checking indexes...');
      const indexesResult = await client.query(`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename LIKE 'auth_%'
        ORDER BY tablename, indexname;
      `);

      console.log('✅ Indexes created:');
      indexesResult.rows.forEach((idx) => {
        console.log(`   ✓ ${idx.tablename}.${idx.indexname}`);
      });

      // Test 4: Check functions
      console.log('\n⚙️  Test 4: Checking functions...');
      const functionsResult = await client.query(`
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_name = ANY($1::text[])
        ORDER BY routine_name;
      `, [REQUIRED_FUNCTIONS]);

      const existingFunctions = functionsResult.rows.map((row) => row.routine_name);

      console.log('✅ Functions created:');
      existingFunctions.forEach((func) => {
        console.log(`   ✓ ${func}()`);
      });

      // Test 5: Try inserting a test user (and rollback)
      console.log('\n🧪 Test 5: Testing write permissions...');
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO auth_users (email, name, auth_type)
        VALUES ($1, $2, $3)
        RETURNING id;
      `, ['test@example.com', 'Test User', 'email']);

      await client.query('ROLLBACK');
      console.log('✅ Write permissions OK (test rolled back)');

      // Test 6: Check foreign key constraints
      console.log('\n🔗 Test 6: Checking foreign key constraints...');
      const constraintsResult = await client.query(`
        SELECT
          tc.table_name,
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name LIKE 'auth_%';
      `);

      console.log('✅ Foreign key constraints:');
      constraintsResult.rows.forEach((fk) => {
        console.log(`   ✓ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });

      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('🎉 All tests passed!');
      console.log('='.repeat(60));

      console.log('\n📊 Database statistics:');
      const statsResult = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM auth_users) as users,
          (SELECT COUNT(*) FROM auth_accounts) as accounts,
          (SELECT COUNT(*) FROM auth_sessions) as sessions;
      `);

      const stats = statsResult.rows[0];
      console.log(`   Users: ${stats.users}`);
      console.log(`   Accounts: ${stats.accounts}`);
      console.log(`   Sessions: ${stats.sessions}`);

      console.log('\n✅ NextAuth database is ready!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
testDatabase();
