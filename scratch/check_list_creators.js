const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: listCreators, error } = await supabase
    .from('list_creators')
    .select('creator_id');
    
  if (error) {
    console.error("Error fetching list_creators:", error);
    return;
  }
  
  console.log("Total referenced creators in list_creators in Supabase:", listCreators.length);
  if (listCreators.length > 0) {
    console.log("Referenced Creator IDs:", listCreators.map(lc => lc.creator_id));
  }
}

run();
