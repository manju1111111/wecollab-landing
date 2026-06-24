const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: realCreators, error } = await supabase
    .from('creators')
    .select('id, name, username, last_fetched_at')
    .not('last_fetched_at', 'is', null);
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Creators with last_fetched_at not null:", realCreators.length);
  console.log(realCreators);
  
  // Also check if any creators are referenced in plan_creators or list_creators
  const { data: planCreators, error: err2 } = await supabase
    .from('plan_creators')
    .select('creator_id');
    
  if (err2) {
    console.error("Error fetching plan_creators:", err2);
  } else {
    console.log("Total creators referenced in plans:", planCreators.length);
  }
}

run();
