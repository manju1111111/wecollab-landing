const { Client } = require('pg');

const dbHost = "aws-1-ap-southeast-2.pooler.supabase.com";
const dbUser = "postgres";
const dbName = "postgres";
const password = "manju123@";

async function run() {
  console.log(`Connecting to ${dbHost}:5432 with password ${password}...`);
  const client = new Client({
    host: dbHost,
    port: 5432,
    user: dbUser,
    password: password,
    database: dbName,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("SUCCESS! Connection established on 5432!");
    await client.end();
  } catch (e) {
    console.log("FAILED to connect on 5432:", e.message);
  }
}

run();
