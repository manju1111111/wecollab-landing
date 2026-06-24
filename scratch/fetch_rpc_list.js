require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("Fetching Supabase OpenAPI schema...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const schema = await res.json();
    console.log("Paths in schema:");
    const paths = Object.keys(schema.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log("RPCs found:", rpcs);
    console.log("All paths:", paths);
  } catch (e) {
    console.error("Failed to fetch schema:", e.message);
  }
}

run();
