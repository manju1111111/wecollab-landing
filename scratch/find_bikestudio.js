const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('creators')
    .select('id, name, username')
    .eq('username', 'bikestudio_mysore');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("bikestudio_mysore in creators table:", data);
}

run();
