const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbHost = "db.xkssgycaqwjqajipoooy.supabase.co";
const dbUser = "postgres";
const dbName = "postgres";

const passwords = [
  'wecollab@24',
  'wecollab@2026',
  'wecollab',
  'postgres',
  'Manju@123',
  'manju123',
  'manju1111111'
];

async function run() {
  const ports = [5432, 6543];

  for (const port of ports) {
    for (const password of passwords) {
      console.log(`Trying ${dbHost}:${port} with password: ${password}`);
      const client = new Client({
        host: dbHost,
        port: port,
        user: dbUser,
        password: password,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log(`SUCCESS! Connected to ${dbHost}:${port} with password: ${password}`);
        const res = await client.query("SELECT current_user, version();");
        console.log("Query result:", res.rows[0]);
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
