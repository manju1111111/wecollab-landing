const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('creators')
    .select('id, name, username, created_at')
    .or('created_at.lt.2026-06-23T09:10:20+00:00,created_at.gt.2026-06-23T09:10:25+00:00');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Creators NOT created in the seeding window:", data.length);
  console.log(data);
}

run();
