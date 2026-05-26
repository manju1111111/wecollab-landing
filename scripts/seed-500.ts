import { createClient } from "@supabase/supabase-js";
import { algoliasearch } from "algoliasearch";
import { faker } from "@faker-js/faker";

// Hardcoded for the script (DO NOT COMMIT)
const SUPABASE_URL = "https://xkssgycaqwjqajipoooy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc3NneWNhcXdqcWFqaXBvb295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3NDY1NSwiZXhwIjoyMDk0OTUwNjU1fQ.LoQxqe49EHetMOc5Mgf-PEHUfzFXCQn7ppf_hbQrZxo"; // Service Role Key

const ALGOLIA_APP_ID = "18VKHZD8P3";
const ALGOLIA_API_KEY = "3b2531592e9757d3339fa3e414727e5e"; // Admin Key
const ALGOLIA_INDEX = "creators";

const CATEGORY_POOLS = [
  "Lifestyle", "Fashion", "Beauty", "Tech", "Gaming", 
  "Fitness", "Food", "Travel", "Education", "Business",
  "Music", "Art", "Sports", "Comedy", "Pets",
  "Face-showing (talking head)", "Short-form (Reels/Shorts/TikTok)",
  "Skincare routine", "Makeup tutorials", "Outfit of the day (OOTD)",
  "Tech unboxing", "Home workouts", "Luxury travel",
  "Personal finance & budgeting", "Dog care & training"
];

async function seed() {
  console.log("Starting seed of 500 creators...");
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

  const creators = [];

  for (let i = 0; i < 500; i++) {
    const isVerified = faker.datatype.boolean({ probability: 0.2 });
    const hasManager = faker.datatype.boolean({ probability: 0.3 });
    const followersCount = faker.number.int({ min: 5000, max: 2000000 });
    const avgViews = Math.floor(followersCount * faker.number.float({ min: 0.05, max: 0.4 }));
    
    // Pick 2-5 random categories
    const numCategories = faker.number.int({ min: 2, max: 5 });
    const categories = faker.helpers.arrayElements(CATEGORY_POOLS, numCategories);

    creators.push({
      name: faker.person.fullName(),
      username: faker.internet.username().toLowerCase(),
      profile_image: faker.image.avatar(),
      bio: faker.lorem.paragraph(),
      followers: followersCount,
      avg_reel_views: avgViews.toString(),
      engagement_rate: parseFloat(faker.number.float({ min: 0.5, max: 12.0 }).toFixed(2)),
      email: faker.datatype.boolean({ probability: 0.7 }) ? faker.internet.email() : null,
      location: `${faker.location.city()}, ${faker.location.country()}`,
      has_manager: hasManager,
      collaboration_pricing: hasManager ? faker.number.int({ min: 500, max: 10000 }) : null,
      response_rate: parseFloat(faker.number.float({ min: 50, max: 100 }).toFixed(1)),
      verified: isVerified,
      brand_safe: faker.datatype.boolean({ probability: 0.9 }),
      fake_follower_risk: faker.helpers.arrayElement(["low", "medium", "high"]),
      growth_percent: parseFloat(faker.number.float({ min: -5, max: 25 }).toFixed(1)),
      tags: categories,
      category: categories[0],
      content_styles: faker.helpers.arrayElements(["Aesthetic", "Raw vlog", "Educational", "Funny", "Cinematic"], 2),
    });
  }

  // Insert into Supabase in chunks of 100
  console.log("Inserting into Supabase...");
  const chunkSize = 100;
  const insertedCreators = [];
  
  for (let i = 0; i < creators.length; i += chunkSize) {
    const chunk = creators.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('creators')
      .insert(chunk)
      .select();
      
    if (error) {
      console.error("Supabase Error:", error);
      return;
    }
    insertedCreators.push(...(data || []));
    console.log(`Inserted ${Math.min(i + chunkSize, creators.length)} / 500 to Supabase`);
  }

  // Format for Algolia
  console.log("Inserting into Algolia...");
  const algoliaRecords = insertedCreators.map(c => ({
    objectID: c.id,
    name: c.name,
    username: c.username,
    avatar_url: c.avatar_url,
    bio: c.bio,
    followers_count: c.followers_count,
    avg_views: c.avg_views,
    engagement_rate: c.engagement_rate,
    categories: c.categories,
    location: c.location,
    verified: c.verified
  }));

  try {
    // Note: algoliasearch ^5.x uses a different API
    // .saveObjects
    for (let i = 0; i < algoliaRecords.length; i += chunkSize) {
       const chunk = algoliaRecords.slice(i, i + chunkSize);
       
       // with the new v5 client:
       // The client doesn't have initIndex anymore. You just call methods on the client.
       // E.g., await client.saveObjects({ indexName: 'creators', objects: chunk })
       // Actually wait, let's look up the v5 API or just use a generic fetch if we aren't sure.
       // Wait, v5 is `const client = algoliasearch(appId, apiKey); client.saveObjects({indexName, objects})` ?
       // No, it's `client.saveObjects({ indexName: ALGOLIA_INDEX, objects: chunk })` maybe.
       // Let's use fetch directly to be safe and avoid v4/v5 API changes.
       
       await fetch(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/batch`, {
         method: 'POST',
         headers: {
           'X-Algolia-API-Key': ALGOLIA_API_KEY,
           'X-Algolia-Application-Id': ALGOLIA_APP_ID,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           requests: chunk.map(r => ({ action: 'addObject', body: r }))
         })
       });
       console.log(`Inserted ${Math.min(i + chunkSize, algoliaRecords.length)} / 500 to Algolia`);
    }
    
    console.log("Seed complete!");
  } catch(e) {
    console.error("Algolia error", e);
  }
}

seed();
