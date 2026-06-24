const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const tables = ['instagram_profiles', 'instagram_posts', 'creator_metrics', 'creators', 'profiles', 'employees'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}": Error -> ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`Table "${table}": Success! Table exists and is accessible. Rows:`, data.length);
    }
  }
}

run();
