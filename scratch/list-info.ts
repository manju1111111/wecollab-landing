import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xkssgycaqwjqajipoooy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc3NneWNhcXdqcWFqaXBvb295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3NDY1NSwiZXhwIjoyMDk0OTUwNjU1fQ.LoQxqe49EHetMOc5Mgf-PEHUfzFXCQn7ppf_hbQrZxo";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  console.log("--- CREATORS COUNT & EXAMPLES ---");
  const { count, error: countErr } = await supabase
    .from("creators")
    .select("*", { count: "exact", head: true });
  if (countErr) {
    console.error("Error getting count:", countErr);
  } else {
    console.log("Total creators in database:", count);
  }

  const { data: creators, error: creatorsErr } = await supabase
    .from("creators")
    .select("id, name, username, followers, engagement_rate, category, location, platforms, profile_pic_url, verification_status, visibility_status")
    .limit(5);

  if (creatorsErr) {
    console.error("Error fetching creators:", creatorsErr);
  } else {
    console.log("Sample creators:");
    console.log(JSON.stringify(creators, null, 2));
  }

  console.log("\n--- NEWSLETTERS COUNT & EXAMPLES ---");
  const { data: newsletters, error: newslettersErr } = await supabase
    .from("newsletters")
    .select("id, title, slug, summary, is_published, published_at")
    .limit(5);

  if (newslettersErr) {
    console.error("Error fetching newsletters:", newslettersErr);
  } else {
    console.log("Sample newsletters:");
    console.log(JSON.stringify(newsletters, null, 2));
  }
}

main();
