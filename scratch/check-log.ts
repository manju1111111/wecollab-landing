import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xkssgycaqwjqajipoooy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc3NneWNhcXdqcWFqaXBvb295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3NDY1NSwiZXhwIjoyMDk0OTUwNjU1fQ.LoQxqe49EHetMOc5Mgf-PEHUfzFXCQn7ppf_hbQrZxo";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("username", "royalchallengers.bengaluru")
    .single();

  if (error) {
    console.error("Error fetching creator:", error);
    return;
  }

  console.log("Creator entry:");
  console.log("Username:", data.username);
  console.log("Category:", data.category);
  console.log("Tags:", data.tags);
}

main();
