const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Retrieving creators before sync...");
  const { data: beforeCreators } = await supabase
    .from('creators')
    .select('id, username, followers, engagement_rate, avg_reel_views, last_fetched_at');
  console.log("Creators before sync:", beforeCreators);

  console.log("\nTriggering sync endpoint: http://localhost:3000/api/cron/sync-creators");
  
  try {
    // We send a request to the local route handler.
    const res = await fetch("http://localhost:3000/api/cron/sync-creators");
    if (!res.ok) {
      console.error(`Endpoint returned error status: ${res.status}`);
      const text = await res.text();
      console.error(text);
      return;
    }
    const data = await res.json();
    console.log("Response from sync endpoint:", JSON.stringify(data, null, 2));

    console.log("\nRetrieving creators after sync...");
    const { data: afterCreators } = await supabase
      .from('creators')
      .select('id, username, followers, engagement_rate, avg_reel_views, last_fetched_at');
    console.log("Creators after sync:", afterCreators);
  } catch (err) {
    console.error("Fetch request failed:", err);
  }
}

test();
