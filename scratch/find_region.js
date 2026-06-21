require('dotenv').config({ path: '.env.local' });

async function check() {
  try {
    const res = await fetch("https://xkssgycaqwjqajipoooy.supabase.co/rest/v1/", {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:");
    for (const [key, value] of res.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

check();
