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

const dbUser = "postgres.xkssgycaqwjqajipoooy";
const dbName = "postgres";
const password = "wecollab@2026"; // test password

async function test() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Testing region ${region} (${host})...`);
    
    const client = new Client({
      host: host,
      port: 6543,
      user: dbUser,
      password: password,
      database: dbName,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`CONNECTED SUCCESS in region ${region}!`);
      await client.end();
      break;
    } catch (e) {
      console.log(`Region ${region} result: ${e.message}`);
      if (!e.message.includes('tenant/user') && !e.message.includes('not found')) {
        console.log(`>>> FOUND IT! Region for tenant is likely ${region} because error is: ${e.message}`);
        await client.end().catch(() => {});
        break;
      }
    }
  }
}

test();
