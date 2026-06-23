const { Client } = require('pg');
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
    
    console.log("Adding deleted_at column to public.employees...");
    const res = await client.query(`
      ALTER TABLE public.employees 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);
    console.log("Success! Columns added successfully.", res);
    
    await client.end();
  } catch (e) {
    console.error("Connection/Query failed:", e.message);
  }
}

run();
