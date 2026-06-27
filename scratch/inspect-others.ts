import * as dotenv from "dotenv";
import path from "path";

// Load local environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function inspectOtherCreators() {
  console.log("=== INSPECTING RECENT CREATORS ===");
  const { data, error } = await supabase
    .from("creators")
    .select("id, name, username, tags, category, created_at, last_fetched_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching creators:", error.message);
    return;
  }

  data.forEach((creator, idx) => {
    console.log(`\n[${idx + 1}] @${creator.username}`);
    console.log("Name:", creator.name);
    console.log("Category:", creator.category);
    console.log("Tags:", creator.tags);
    console.log("Created At:", creator.created_at);
  });
}

inspectOtherCreators();
