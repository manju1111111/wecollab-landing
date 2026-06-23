const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking profiles table for b648f470-60b9-42a7-ad3d-10497c13625f...");
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'b648f470-60b9-42a7-ad3d-10497c13625f')
    .single();
    
  if (error) {
    console.error("Error querying profiles:", error.message);
    return;
  }
  
  console.log("Found profile record:");
  console.log(data);
}

check();
