const { Client } = require('pg');

const hosts = [
  "aws-1-ap-southeast-2.pooler.supabase.com",
  "aws-0-ap-south-1.pooler.supabase.com"
];

const dbUser = "postgres.xkssgycaqwjqajipoooy";
const dbName = "postgres";

const passwords = [
  'wecollab@24',
  'wecollab@2026',
  'wecollab',
  'postgres',
  'Manju@123',
  'manju123',
  'manju1111111',
  'manju123@'
];

async function run() {
  for (const host of hosts) {
    for (const password of passwords) {
      console.log(`Trying host ${host} with password ${password}...`);
      const client = new Client({
        host: host,
        port: 6543,
        user: dbUser,
        password: password,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log(`\nSUCCESS! Connected to ${host} with password: ${password}\n`);
        const res = await client.query("SELECT version();");
        console.log("Database version:", res.rows[0]);
        await client.end();
        return;
      } catch (e) {
        console.log(`Failed: ${e.message}`);
      }
    }
  }
  console.log("All attempts failed.");
}

run();
