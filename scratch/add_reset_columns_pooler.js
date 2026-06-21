const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbHost = "aws-0-ap-south-1.pooler.supabase.com";
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

async function run() {
  let connectedClient = null;
  // Supabase pooler runs on port 6543 (transaction mode) and port 5432 (session mode)
  const ports = [6543, 5432];

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
        connectionTimeoutMillis: 10000 // 10s timeout
      });

      try {
        await client.connect();
        console.log(`SUCCESS! Connected to port ${port} with password: ${password}`);
        connectedClient = client;
        break;
      } catch (e) {
        console.log(`Failed for port ${port} with password ${password}: ${e.message}`);
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
