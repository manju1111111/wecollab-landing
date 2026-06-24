const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .limit(5);
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Sample creators from table 'creators':");
  data.forEach(c => {
    console.log({
      id: c.id,
      name: c.name,
      username: c.username,
      verification_status: c.verification_status,
      visibility_status: c.visibility_status,
      last_fetched_at: c.last_fetched_at,
      created_at: c.created_at
    });
  });
}

run();
