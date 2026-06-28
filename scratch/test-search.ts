import * as dotenv from "dotenv";
import path from "path";

// Load local environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { searchEngine } from "../lib/search-client";

async function run() {
  console.log("=== SEARCHING ALGOLIA FOR CREATORS IN DISCOVER PAGE ===");
  try {
    const res = await searchEngine.search({ limit: 10 });
    console.log(`Found ${res.hits.length} hits.`);

    res.hits.forEach((hit, idx) => {
      console.log(`\n[${idx + 1}] @${(hit as any).username}`);
      console.log("Name:", hit.name);
      console.log("profile_pic_url:", (hit as any).profile_pic_url);
      console.log("profile_image:", (hit as any).profile_image);
      console.log("profile_image_url:", (hit as any).profile_image_url);
      console.log("avatar_url:", (hit as any).avatar_url);
      console.log("avatar:", (hit as any).avatar);
    });
  } catch (e: any) {
    console.error("Search failed:", e.message);
  }
}

run();
