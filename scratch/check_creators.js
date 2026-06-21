const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { count, error } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error("Error fetching creators count:", error);
    return;
  }
  
  console.log("Total creators count in database:", count);
  
  // Also get some sample usernames
  const { data, error: err2 } = await supabase
    .from('creators')
    .select('id, name, username, last_fetched_at')
    .limit(10);
    
  if (err2) {
    console.error("Error fetching sample creators:", err2);
    return;
  }
  
  console.log("Sample creators:");
  console.log(data);
}

check();
