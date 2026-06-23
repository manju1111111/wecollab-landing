const { Client } = require('pg');

const dbHost = "2406:da1c:61c:d600:b946:12b6:8c91:aa98";
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
      console.log(`Trying IPv6 ${dbHost}:${port} with user ${dbUser} and password: ${password}`);
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
        console.log(`\nSUCCESS! Connected to IPv6 ${dbHost}:${port} with password: ${password}\n`);
        const res = await client.query("SELECT current_user, version();");
        console.log("Query result:", res.rows[0]);
        
        console.log("Altering table to add deleted_at...");
        await client.query("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;");
        console.log("Column deleted_at added successfully!");
        
        await client.end();
        return;
      } catch (e) {
        console.log(`Failed: ${e.message}`);
      }
    }
  }
  console.log("All IPv6 attempts failed.");
}

run();
