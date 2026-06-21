const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'ca-central-1',
  'sa-east-1'
];

const prefixes = ['aws-0', 'aws-1', 'aws-2'];
const dbUser = "postgres.xkssgycaqwjqajipoooy";
const dbName = "postgres";
const password = "wecollab@2026"; // test password

async function test() {
  for (const region of regions) {
    for (const prefix of prefixes) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      console.log(`Testing host: ${host}...`);
      
      const client = new Client({
        host: host,
        port: 6543,
        user: dbUser,
        password: password,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 2000
      });

      try {
        await client.connect();
        console.log(`>>> CONNECTED SUCCESS at ${host}!`);
        await client.end();
        process.exit(0);
      } catch (e) {
        if (!e.message.includes('tenant/user') && !e.message.includes('not found') && !e.message.includes('ENOTFOUND')) {
          console.log(`>>> POTENTIAL MATCH! Host ${host} returned: ${e.message}`);
          await client.end().catch(() => {});
          process.exit(0);
        }
      }
    }
  }
  console.log("Finished all host checks.");
}

test();
