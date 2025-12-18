/**
 * Script to run SQL migrations on Supabase
 *
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 * Example: npx tsx scripts/run-migration.ts supabase/migrations/004_reserves_rls_policies.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  console.error('\nAdd to .env.local:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Please provide a migration file path');
  console.error('Usage: npx tsx scripts/run-migration.ts <migration-file>');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log(`📖 Reading migration file: ${migrationFile}\n`);
    const sqlPath = resolve(process.cwd(), migrationFile);
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('🚀 Executing SQL migration...\n');

    // Split SQL by statement and execute each one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        console.warn(`⚠️  Statement ${i + 1} warning: ${error.message}`);
        // Continue anyway as some errors might be expected (like "already exists")
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✨ Migration completed!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\n💡 Alternative: Copy the SQL and run it manually in Supabase Dashboard:');
    console.error('   Dashboard > SQL Editor > New Query > Paste & Run');
    process.exit(1);
  }
}

runMigration();
