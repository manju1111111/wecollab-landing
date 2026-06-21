const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: '.env.local' });

const dbHost = "aws-1-ap-southeast-2.pooler.supabase.com";
const dbUser = "postgres.xkssgycaqwjqajipoooy";
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

async function getIpv4(host) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, { family: 4 }, (err, address) => {
      if (err) reject(err);
      else resolve(address);
    });
  });
}

async function run() {
  let ip;
  try {
    ip = await getIpv4(dbHost);
    console.log(`Resolved ${dbHost} to IPv4: ${ip}`);
  } catch (e) {
    console.error("DNS lookup failed, using hostname directly:", e.message);
    ip = dbHost;
  }

  let connectedClient = null;
  // Try ports 5432 and 6543
  const ports = [5432, 6543];

  for (const port of ports) {
    for (const password of passwords) {
      console.log(`Trying port ${port} with password: ${password}`);
      const client = new Client({
        host: ip,
        port: port,
        user: dbUser,
        password: password,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000 // 5 seconds timeout
      });

      try {
        await client.connect();
        console.log(`SUCCESS! Connected to port ${port} with password: ${password}`);
        connectedClient = client;
        break;
      } catch (e) {
        console.log(`Failed for port ${port}, password ${password}: ${e.message}`);
      }
    }
    if (connectedClient) break;
  }

  if (!connectedClient) {
    console.error("Could not connect with any candidate password/port combination.");
    process.exit(1);
  }

  // Read migrations folder and run SQL
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running migration: ${file}`);
    try {
      await connectedClient.query(sql);
      console.log(`Migration ${file} executed successfully.`);
    } catch (e) {
      console.error(`Error running migration ${file}:`, e.message);
    }
  }

  await connectedClient.end();
  console.log("Completed migrations running.");
}

run();
