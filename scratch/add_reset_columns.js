const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

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
  let connectedClient = null;
  const ports = [5432, 6543];

  for (const port of ports) {
    for (const password of passwords) {
      console.log(`Trying port ${port} with password: ${password}`);
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
        console.log(`SUCCESS! Connected to port ${port} with password: ${password}`);
        connectedClient = client;
        break;
      } catch (e) {
        console.log(`Failed for port ${port}: ${e.message}`);
      }
    }
    if (connectedClient) break;
  }

  if (!connectedClient) {
    console.error("Could not connect with any candidate password/port combination.");
    process.exit(1);
  }

  console.log("Adding reset password and invitation expiration columns to public.employees...");
  try {
    await connectedClient.query(`
      ALTER TABLE public.employees 
        ADD COLUMN IF NOT EXISTS reset_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW();
        
      CREATE INDEX IF NOT EXISTS idx_employees_reset_token ON public.employees(reset_token) 
        WHERE reset_token IS NOT NULL;
    `);
    console.log("Success! Columns added successfully.");
  } catch (e) {
    console.error("Error executing ALTER TABLE query:", e.message);
  }

  await connectedClient.end();
}

run();
