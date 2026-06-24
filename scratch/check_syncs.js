const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: profiles, error } = await supabase
    .from('creator_profiles')
    .select('username, full_name');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Real Synced Profiles in creator_profiles:", profiles);
}

run();
