const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_tables'); // RPC might not exist, let's try direct select from pg_class or another table if we can
  // Let's just try selecting from some tables to see which ones fail and succeed.
  const tables = [
    'creators',
    'creator_profiles',
    'creator_metrics',
    'creator_posts',
    'creator_scores',
    'instagram_profiles',
    'instagram_posts',
    'plans',
    'plan_lists',
    'plan_creators'
  ];
  
  console.log("Checking tables existence...");
  for (const table of tables) {
    const { data: res, error: err } = await supabase.from(table).select('count', { head: true, count: 'exact' });
    if (err) {
      console.log(`Table "${table}": DOES NOT EXIST (${err.message})`);
    } else {
      console.log(`Table "${table}": EXISTS (Count: ${res})`);
    }
  }
}

run();
