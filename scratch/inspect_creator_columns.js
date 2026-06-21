const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching creator:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Creator columns and sample values:");
    console.log(Object.keys(data[0]));
    console.log(data[0]);
  } else {
    console.log("No creators found in the database to inspect.");
  }
}

inspect();
