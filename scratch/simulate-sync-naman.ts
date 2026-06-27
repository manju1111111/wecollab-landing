import * as dotenv from "dotenv";
import path from "path";

// Load local environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { instaloaderService } from "../lib/instagram/instaloader";

async function simulate() {
  const username = "_naman_gulati";
  console.log(`=== SIMULATING SYNC & CLASSIFICATION FOR @${username} ===`);
  try {
    const result = await instaloaderService.analyzeProfile(username);
    console.log("Sync Source:", result.source);
    console.log("Profile Name:", result.profile.full_name);
    console.log("Gemini Category:", result.profile.category);
    console.log("Gemini Tags Count:", result.profile.tags?.length || 0);
    console.log("Gemini Tags:", result.profile.tags);
  } catch (e: any) {
    console.error("Simulation failed:", e);
  }
}

simulate();
