import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xkssgycaqwjqajipoooy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc3NneWNhcXdqcWFqaXBvb295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3NDY1NSwiZXhwIjoyMDk0OTUwNjU1fQ.LoQxqe49EHetMOc5Mgf-PEHUfzFXCQn7ppf_hbQrZxo";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  console.log("Updating creators to Verified and public...");
  const { data, error } = await supabase
    .from("creators")
    .update({ 
      verification_status: "Verified", 
      visibility_status: true 
    })
    .neq("username", "");

  if (error) {
    console.error("Error updating creators:", error);
  } else {
    console.log("Successfully updated creators!");
  }
}

main();
