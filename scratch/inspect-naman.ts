import * as dotenv from "dotenv";
import path from "path";

// Load local environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function inspectNaman() {
  console.log("=== INSPECTING CREATOR @_naman_gulati IN SUPABASE ===");
  const { data, error } = await supabase
    .from("creators")
    .select("id, name, username, tags, category, created_at, last_fetched_at")
    .eq("username", "_naman_gulati")
    .single();

  if (error) {
    console.error("Error fetching creator:", error.message);
    return;
  }

  console.log("Creator ID:", data.id);
  console.log("Name:", data.name);
  console.log("Username:", data.username);
  console.log("Category:", data.category);
  console.log("Tags:", data.tags);
  console.log("Created At:", data.created_at);
  console.log("Last Fetched At:", data.last_fetched_at);
}

inspectNaman();
