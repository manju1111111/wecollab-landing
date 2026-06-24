const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID;
const ALGOLIA_API_KEY = process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_API_KEY;
const ALGOLIA_INDEX = process.env.ALGOLIA_INDEX || "creators";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY) {
  console.error("Missing Algolia credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Cleaning up mock creators from Supabase 'creators' table...");
  
  // Deleting all creators (since all 499 creators in the table were verified as mock seeded creators)
  const { count, error } = await supabase
    .from('creators')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
  if (error) {
    console.error("Error deleting creators from Supabase:", error);
    process.exit(1);
  }
  
  console.log(`Successfully deleted ${count} mock creators from Supabase database.`);
  
  console.log(`Clearing Algolia search index: "${ALGOLIA_INDEX}"...`);
  try {
    const response = await fetch(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/clear`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`Successfully cleared Algolia index! Task ID:`, result.taskID);
    } else {
      const errorText = await response.text();
      console.error(`Failed to clear Algolia index. Status: ${response.status}. Error: ${errorText}`);
    }
  } catch (e) {
    console.error("Error clearing Algolia index:", e);
  }
  
  console.log("Cleanup complete!");
}

run();
