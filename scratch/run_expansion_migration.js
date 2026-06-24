const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const dbHost = "aws-1-ap-southeast-2.pooler.supabase.com";
const dbUser = "postgres.xkssgycaqwjqajipoooy";
const dbName = "postgres";
const password = "manju123@";

async function run() {
  console.log(`Connecting to ${dbHost}:6543...`);
  const client = new Client({
    host: dbHost,
    port: 6543,
    user: dbUser,
    password: password,
    database: dbName,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("SUCCESS! Connected to Supabase DB.");
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260623_creator_metrics_expansion.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log("Applying creator metrics expansion SQL...");
    const res = await client.query(sql);
    console.log("Success! Migration applied successfully.", res);
    
    await client.end();
  } catch (e) {
    console.error("Connection/Query failed:", e.message);
  }
}

run();
