/**
 * Script to update the RxNorm schema with new columns
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const run = async () => {
  try {
    // Ensure environment variables are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
      process.exit(1);
    }

    // Create Supabase client with service role key for admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Load the SQL from the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_details_fields_to_rxnorm.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add_details_fields_to_rxnorm.sql');
    
    // Execute the SQL directly using the RPSQL function
    const { data, error } = await supabase.rpc('pgdebug_execute', { query: sql });

    if (error) {
      console.error('Error running migration:', error);
      process.exit(1);
    }

    console.log('Migration successful!');

    // Verify the columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('rxnorm_medications')
      .select('details_checked')
      .limit(1);

    if (columnsError) {
      console.error('Error verifying columns:', columnsError);
      process.exit(1);
    }

    console.log('Columns verified successfully');
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
};

run();
