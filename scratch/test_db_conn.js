const { Client } = require('pg');

const dbHost = "aws-1-ap-southeast-2.pooler.supabase.com";
const dbUser = "postgres.xkssgycaqwjqajipoooy";
const dbName = "postgres";
const password = "manju123@";

async function run() {
  console.log(`Connecting to ${dbHost}:6543 with password ${password}...`);
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
    console.log("SUCCESS! Connection established!");
    await client.end();
  } catch (e) {
    console.log("FAILED to connect:", e.message);
  }
}

run();
