const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: profiles, error } = await supabase
    .from('instagram_profiles')
    .select('*');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Profiles in instagram_profiles:", profiles.length);
  console.log(profiles);
}

run();
