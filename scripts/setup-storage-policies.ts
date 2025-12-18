/**
 * Script to setup Storage policies for cmr-photos bucket
 *
 * Run with: npx tsx scripts/setup-storage-policies.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStoragePolicies() {
  console.log('🔧 Setting up storage policies for cmr-photos bucket...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }

    const bucket = buckets.find(b => b.name === 'cmr-photos');

    if (!bucket) {
      console.log('📦 Creating cmr-photos bucket...');
      const { error: createError } = await supabase.storage.createBucket('cmr-photos', {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      console.log('✅ Bucket created successfully\n');
    } else {
      console.log('✅ Bucket already exists\n');
    }

    // Create storage policies using raw SQL
    console.log('📝 Creating storage policies...\n');

    // Policy 1: Users can upload photos
    const insertPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Users can upload reserve photos"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'cmr-photos'
        AND auth.uid() IS NOT NULL
      );
    `;

    // Policy 2: Users can view photos
    const selectPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Users can view reserve photos"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'cmr-photos'
        AND auth.uid() IS NOT NULL
      );
    `;

    // Policy 3: Users can delete their own photos
    const deletePolicySQL = `
      CREATE POLICY IF NOT EXISTS "Users can delete their reserve photos"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'cmr-photos'
        AND auth.uid() IS NOT NULL
      );
    `;

    // Execute policies
    const { error: insertError } = await supabase.rpc('exec_sql', { sql: insertPolicySQL });
    if (insertError && !insertError.message.includes('already exists')) {
      console.warn('⚠️  Insert policy:', insertError.message);
    } else {
      console.log('✅ Insert policy created');
    }

    const { error: selectError } = await supabase.rpc('exec_sql', { sql: selectPolicySQL });
    if (selectError && !selectError.message.includes('already exists')) {
      console.warn('⚠️  Select policy:', selectError.message);
    } else {
      console.log('✅ Select policy created');
    }

    const { error: deleteError } = await supabase.rpc('exec_sql', { sql: deletePolicySQL });
    if (deleteError && !deleteError.message.includes('already exists')) {
      console.warn('⚠️  Delete policy:', deleteError.message);
    } else {
      console.log('✅ Delete policy created');
    }

    console.log('\n✨ Storage policies setup complete!\n');
    console.log('📌 Manual setup instructions (if the above failed):');
    console.log('1. Go to Supabase Dashboard > Storage > cmr-photos');
    console.log('2. Click on "Policies" tab');
    console.log('3. Create the following policies:\n');
    console.log('   INSERT Policy: "Users can upload reserve photos"');
    console.log('   - Target: authenticated');
    console.log('   - Definition: bucket_id = \'cmr-photos\' AND auth.uid() IS NOT NULL\n');
    console.log('   SELECT Policy: "Users can view reserve photos"');
    console.log('   - Target: authenticated');
    console.log('   - Definition: bucket_id = \'cmr-photos\' AND auth.uid() IS NOT NULL\n');
    console.log('   DELETE Policy: "Users can delete their reserve photos"');
    console.log('   - Target: authenticated');
    console.log('   - Definition: bucket_id = \'cmr-photos\' AND auth.uid() IS NOT NULL\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupStoragePolicies();
