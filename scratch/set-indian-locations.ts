import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xkssgycaqwjqajipoooy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc3NneWNhcXdqcWFqaXBvb295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3NDY1NSwiZXhwIjoyMDk0OTUwNjU1fQ.LoQxqe49EHetMOc5Mgf-PEHUfzFXCQn7ppf_hbQrZxo";

const CITIES = ["Bangalore, India", "Mumbai, India", "Delhi, India", "Hyderabad, India", "Chennai, India"];
const PLATFORMS_POOL = [
  [{ name: "Instagram", followers: 50000, url: "#" }],
  [{ name: "YouTube", followers: 150000, url: "#" }],
  [{ name: "Instagram", followers: 75000, url: "#" }, { name: "YouTube", followers: 120000, url: "#" }],
  [{ name: "LinkedIn", followers: 12000, url: "#" }],
  [{ name: "Instagram", followers: 20000, url: "#" }, { name: "LinkedIn", followers: 8500, url: "#" }]
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  console.log("Fetching all creators...");
  const { data: creators, error: fetchErr } = await supabase
    .from("creators")
    .select("id");
    
  if (fetchErr) {
    console.error("Error fetching creators:", fetchErr);
    return;
  }
  
  console.log(`Fetched ${creators.length} creators. Updating locations and platforms...`);
  
  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const city = CITIES[i % CITIES.length];
    const platforms = PLATFORMS_POOL[i % PLATFORMS_POOL.length];
    
    const { error: updateErr } = await supabase
      .from("creators")
      .update({
        location: city,
        platforms: platforms
      })
      .eq("id", creator.id);
      
    if (updateErr) {
      console.error(`Error updating creator ${creator.id}:`, updateErr);
    }
  }
  
  console.log("Successfully updated all creators with Indian cities and platform JSON arrays!");
}

main();
